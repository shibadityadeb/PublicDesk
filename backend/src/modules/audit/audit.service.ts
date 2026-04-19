import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto, PaginatedResponse } from '@common/dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    previousState?: Record<string, any>,
    newState?: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    const log = this.auditRepository.create({
      userId,
      action,
      entityType,
      entityId,
      previousState,
      newState,
      metadata,
    });

    return this.auditRepository.save(log);
  }

  async getAuditLog(
    filters: { entityType?: string; entityId?: string; userId?: string },
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.userId) where.userId = filters.userId;

    const [data, total] = await this.auditRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
