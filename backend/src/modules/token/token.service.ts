import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import * as QRCode from 'qrcode';
import { Token } from './entities/token.entity';
import { GenerateTokenDto, CallNextDto } from './dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { TokenStatus, Priority, UserRole } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';
import { QueueGateway } from '../../gateways/queue.gateway';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly logger: AppLoggerService,
    private readonly queueGateway: QueueGateway,
  ) {}

  private getPriorityPrefix(priority: Priority): string {
    switch (priority) {
      case Priority.URGENT: return 'U';
      case Priority.HIGH: return 'P';
      default: return 'A';
    }
  }

  private async generateTokenNumber(officeId: string, priority: Priority): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const prefix = this.getPriorityPrefix(priority);

    const count = await this.tokenRepository
      .createQueryBuilder('token')
      .where('token.officeId = :officeId', { officeId })
      .andWhere('token.createdAt >= :today', { today })
      .andWhere('token.createdAt < :tomorrow', { tomorrow })
      .andWhere('token.tokenNumber LIKE :prefix', { prefix: `${prefix}-%` })
      .getCount();

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }

  async generateToken(citizenId: string, dto: GenerateTokenDto): Promise<Token> {
    const priority = dto.priority || Priority.NORMAL;
    const tokenNumber = await this.generateTokenNumber(dto.officeId, priority);

    // Estimate wait time: count waiting tokens ahead * avg service time (15 min)
    const waitingCount = await this.tokenRepository.count({
      where: { officeId: dto.officeId, serviceId: dto.serviceId, status: TokenStatus.WAITING },
    });
    const estimatedWaitTime = waitingCount * 15;

    const qrData = JSON.stringify({
      tokenNumber,
      citizenId,
      officeId: dto.officeId,
      serviceId: dto.serviceId,
      appointmentId: dto.appointmentId,
      issuedAt: new Date().toISOString(),
    });

    const qrCode = await QRCode.toDataURL(qrData);

    const token = this.tokenRepository.create({
      tokenNumber,
      qrCode,
      qrData,
      citizenId,
      officeId: dto.officeId,
      serviceId: dto.serviceId,
      appointmentId: dto.appointmentId,
      priority,
      notes: dto.notes,
      estimatedWaitTime,
      status: TokenStatus.WAITING,
    });

    await this.tokenRepository.save(token);
    this.logger.log(`Token ${tokenNumber} generated for citizen ${citizenId}`, 'TokenService');

    // Notify office subscribers a new token joined
    this.queueGateway.emitQueueUpdate(dto.officeId, { action: 'token_generated' });

    return token;
  }

  async findById(id: string): Promise<Token> {
    const token = await this.tokenRepository.findOne({
      where: { id },
      relations: ['citizen', 'office', 'service'],
    });
    if (!token) throw new NotFoundException('Token not found');
    return token;
  }

  async findByOffice(officeId: string, date?: string, status?: TokenStatus): Promise<Token[]> {
    const query = this.tokenRepository
      .createQueryBuilder('token')
      .where('token.officeId = :officeId', { officeId })
      .leftJoinAndSelect('token.citizen', 'citizen')
      .leftJoinAndSelect('token.service', 'service')
      .orderBy('token.priority', 'DESC')
      .addOrderBy('token.createdAt', 'ASC');

    if (status) {
      query.andWhere('token.status = :status', { status });
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.andWhere('token.createdAt BETWEEN :start AND :end', { start, end });
    }

    return query.getMany();
  }

  async findByCitizen(citizenId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Token>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.tokenRepository.findAndCount({
      where: { citizenId },
      skip,
      take: limit,
      relations: ['office', 'service'],
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getQueuePosition(tokenId: string): Promise<{ position: number; estimatedWait: number }> {
    const token = await this.findById(tokenId);

    if (token.status !== TokenStatus.WAITING) {
      return { position: 0, estimatedWait: 0 };
    }

    const position = await this.tokenRepository
      .createQueryBuilder('token')
      .where('token.officeId = :officeId', { officeId: token.officeId })
      .andWhere('token.serviceId = :serviceId', { serviceId: token.serviceId })
      .andWhere('token.status = :status', { status: TokenStatus.WAITING })
      .andWhere('token.createdAt <= :createdAt', { createdAt: token.createdAt })
      .getCount();

    return { position, estimatedWait: position * 15 };
  }

  async callNext(officeId: string, dto: CallNextDto): Promise<Token | null> {
    const query = this.tokenRepository
      .createQueryBuilder('token')
      .where('token.officeId = :officeId', { officeId })
      .andWhere('token.status = :status', { status: TokenStatus.WAITING });

    if (dto.serviceId) {
      query.andWhere('token.serviceId = :serviceId', { serviceId: dto.serviceId });
    }

    query.orderBy('token.priority', 'DESC').addOrderBy('token.createdAt', 'ASC');

    const nextToken = await query.getOne();

    if (!nextToken) return null;

    nextToken.status = TokenStatus.CALLED;
    nextToken.calledAt = new Date();
    nextToken.counterId = dto.counterId;
    nextToken.counterNumber = dto.counterNumber;
    await this.tokenRepository.save(nextToken);

    this.logger.log(`Token ${nextToken.tokenNumber} called at counter ${dto.counterNumber}`, 'TokenService');

    // Emit real-time events
    this.queueGateway.emitTokenCalled(officeId, {
      tokenId: nextToken.id,
      tokenNumber: nextToken.tokenNumber,
      counterNumber: dto.counterNumber,
      citizenId: nextToken.citizenId,
    });
    this.queueGateway.emitQueueUpdate(officeId, { action: 'token_called' });

    return nextToken;
  }

  async startService(tokenId: string, counterId: string, counterNumber: number): Promise<Token> {
    const token = await this.findById(tokenId);

    if (token.status !== TokenStatus.CALLED) {
      throw new BadRequestException('Token must be in CALLED status to start service');
    }

    token.status = TokenStatus.IN_SERVICE;
    token.servedAt = new Date();
    token.counterId = counterId;
    token.counterNumber = counterNumber;
    await this.tokenRepository.save(token);

    return token;
  }

  async completeToken(tokenId: string): Promise<Token> {
    const token = await this.findById(tokenId);

    if (token.status !== TokenStatus.IN_SERVICE && token.status !== TokenStatus.CALLED) {
      throw new BadRequestException('Token must be in CALLED or IN_SERVICE status to complete');
    }

    token.status = TokenStatus.COMPLETED;
    token.completedAt = new Date();

    if (token.servedAt) {
      token.actualWaitTime = Math.round((token.completedAt.getTime() - token.servedAt.getTime()) / 60000);
    }

    await this.tokenRepository.save(token);
    this.logger.log(`Token ${token.tokenNumber} completed`, 'TokenService');

    // Emit real-time events
    this.queueGateway.emitTokenCompleted(token.officeId, token.id);
    this.queueGateway.emitQueueUpdate(token.officeId, { action: 'token_completed' });

    return token;
  }

  async cancelToken(tokenId: string, user: User, reason?: string): Promise<Token> {
    const token = await this.findById(tokenId);

    const canCancel =
      token.citizenId === user.id ||
      [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER, UserRole.SUPER_ADMIN].includes(user.role as UserRole);

    if (!canCancel) throw new ForbiddenException('You cannot cancel this token');

    if ([TokenStatus.COMPLETED, TokenStatus.CANCELLED, TokenStatus.NO_SHOW].includes(token.status)) {
      throw new BadRequestException(`Cannot cancel token with status: ${token.status}`);
    }

    token.status = TokenStatus.CANCELLED;
    if (reason) token.notes = reason;
    await this.tokenRepository.save(token);

    return token;
  }

  async noShow(tokenId: string): Promise<Token> {
    const token = await this.findById(tokenId);

    if (token.status !== TokenStatus.CALLED) {
      throw new BadRequestException('Token must be in CALLED status to mark as no-show');
    }

    token.status = TokenStatus.NO_SHOW;
    await this.tokenRepository.save(token);

    return token;
  }

  async getQueueStatus(officeId: string, serviceId?: string): Promise<any> {
    const baseQuery = { officeId, ...(serviceId ? { serviceId } : {}) };

    const [waiting, called, inService, completedToday] = await Promise.all([
      this.tokenRepository.count({ where: { ...baseQuery, status: TokenStatus.WAITING } }),
      this.tokenRepository.count({ where: { ...baseQuery, status: TokenStatus.CALLED } }),
      this.tokenRepository.count({ where: { ...baseQuery, status: TokenStatus.IN_SERVICE } }),
      this.tokenRepository.count({ where: { ...baseQuery, status: TokenStatus.COMPLETED } }),
    ]);

    // Calculate average wait time from completed tokens today
    const completedTokens = await this.tokenRepository.find({
      where: { ...baseQuery, status: TokenStatus.COMPLETED },
      select: ['actualWaitTime'],
    });

    const avgWaitTime = completedTokens.length > 0
      ? Math.round(completedTokens.reduce((sum, t) => sum + (t.actualWaitTime || 0), 0) / completedTokens.length)
      : 0;

    return { waiting, called, inService, completedToday, avgWaitTime, estimatedNewWait: waiting * 15 };
  }

  async getActiveQueue(officeId: string, serviceId?: string): Promise<Token[]> {
    const query = this.tokenRepository
      .createQueryBuilder('token')
      .where('token.officeId = :officeId', { officeId })
      .andWhere('token.status IN (:...statuses)', { statuses: [TokenStatus.WAITING, TokenStatus.CALLED] })
      .leftJoinAndSelect('token.citizen', 'citizen')
      .leftJoinAndSelect('token.service', 'service')
      .orderBy('CASE token.status WHEN \'CALLED\' THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('token.priority', 'DESC')
      .addOrderBy('token.createdAt', 'ASC');

    if (serviceId) {
      query.andWhere('token.serviceId = :serviceId', { serviceId });
    }

    return query.getMany();
  }
}
