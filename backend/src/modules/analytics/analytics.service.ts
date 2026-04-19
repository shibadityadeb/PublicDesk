import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppLoggerService } from '@common/logger/logger.service';
import { Token } from '@modules/token/entities/token.entity';
import { Appointment } from '@modules/appointment/entities/appointment.entity';
import { TokenStatus, AppointmentStatus, Priority, UserRole, UserStatus, ServiceStatus, OfficeStatus } from '@common/enums';
import { Office } from '@modules/office/entities/office.entity';
import { Service } from '@modules/service/entities/service.entity';
import { User } from '@modules/user/entities/user.entity';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.seedMockAnalyticsData();
  }

  private async seedMockAnalyticsData(): Promise<void> {
    const officeCount = await this.officeRepository.count();
    if (officeCount === 0) return;

    const serviceCount = await this.serviceRepository.count();
    if (serviceCount === 0) {
      const offices = await this.officeRepository.find({ order: { createdAt: 'ASC' } });
      const templates = [
        {
          name: 'Passport Services',
          description: 'New passport and renewals',
          category: 'Passport Services',
          estimatedDuration: 30,
          maxDailyCapacity: 120,
          requiresAppointment: true,
          requiresDocuments: true,
          documentList: ['ID Proof', 'Address Proof', 'Photos'],
          fees: 1500,
        },
        {
          name: 'Driving License',
          description: 'License issuance and renewal',
          category: 'Driving License',
          estimatedDuration: 20,
          maxDailyCapacity: 150,
          requiresAppointment: true,
          requiresDocuments: true,
          documentList: ['ID Proof', 'Test Certificate'],
          fees: 600,
        },
        {
          name: 'Birth Certificate',
          description: 'Issue certified birth certificates',
          category: 'Certificates',
          estimatedDuration: 15,
          maxDailyCapacity: 200,
          requiresAppointment: false,
          requiresDocuments: true,
          documentList: ['Hospital Record', 'Parent ID'],
          fees: 50,
        },
        {
          name: 'Property Tax',
          description: 'Property tax payment and receipts',
          category: 'Tax Services',
          estimatedDuration: 10,
          maxDailyCapacity: 250,
          requiresAppointment: false,
          requiresDocuments: false,
          fees: 0,
        },
      ];

      let counter = 1;
      const services: Partial<Service>[] = [];
      for (const office of offices) {
        for (const t of templates) {
          services.push({
            ...t,
            code: `SVC-${String(counter).padStart(3, '0')}`,
            officeId: office.id,
            status: ServiceStatus.ACTIVE,
          });
          counter += 1;
        }
      }

      await this.serviceRepository.save(services);
      this.logger.log('Seeded mock services', 'AnalyticsService');
    }

    const tokenCount = await this.tokenRepository.count();
    const appointmentCount = await this.appointmentRepository.count();
    if (tokenCount > 0 || appointmentCount > 0) return;

    const offices = await this.officeRepository.find({ order: { createdAt: 'ASC' } });
    const services = await this.serviceRepository.find({ order: { createdAt: 'ASC' } });

    if (offices.length === 0 || services.length === 0) return;

    const userCount = await this.userRepository.count();
    const basePassword = await bcrypt.hash('Password@123', 10);
    if (userCount === 0) {
      const users: Partial<User>[] = [
        {
          firstName: 'Aarav',
          lastName: 'Mehta',
          email: 'aarav.mehta@publicdesk.local',
          phone: '+919900000001',
          password: basePassword,
          role: UserRole.CITIZEN,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: false,
        },
        {
          firstName: 'Diya',
          lastName: 'Sharma',
          email: 'diya.sharma@publicdesk.local',
          phone: '+919900000002',
          password: basePassword,
          role: UserRole.CITIZEN,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: false,
        },
        {
          firstName: 'Rahul',
          lastName: 'Singh',
          email: 'rahul.singh@publicdesk.local',
          phone: '+919900000003',
          password: basePassword,
          role: UserRole.CITIZEN,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: false,
        },
      ];

      await this.userRepository.save(users);
      this.logger.log('Seeded mock users', 'AnalyticsService');
    }

    const citizens = await this.userRepository.find({ where: { role: UserRole.CITIZEN } });
    if (citizens.length === 0) return;

    const now = new Date();
    const days = [0, 1, 2, 3, 4, 5, 6];
    const appointments: Partial<Appointment>[] = [];
    const tokens: Partial<Token>[] = [];

    let appointmentCounter = 1;
    let tokenCounter = 1;

    for (const offset of days) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      date.setHours(0, 0, 0, 0);

      for (const citizen of citizens) {
        const office = offices[appointmentCounter % offices.length];
        const service = services[appointmentCounter % services.length];
        const scheduledTime = `${9 + (appointmentCounter % 8)}:00`;

        const statusPool = [
          AppointmentStatus.COMPLETED,
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CANCELLED,
          AppointmentStatus.IN_PROGRESS,
        ];
        const status = statusPool[appointmentCounter % statusPool.length];

        appointments.push({
          appointmentNumber: `APT-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(appointmentCounter).padStart(4, '0')}`,
          citizenId: citizen.id,
          serviceId: service.id,
          officeId: office.id,
          scheduledDate: date,
          scheduledTime,
          status,
          priority: Priority.NORMAL,
          notes: 'Mock appointment data',
          completedAt: status === AppointmentStatus.COMPLETED ? new Date(date.getTime() + 60 * 60 * 1000) : undefined,
        });

        const tokenStatusPool = [
          TokenStatus.COMPLETED,
          TokenStatus.WAITING,
          TokenStatus.CANCELLED,
          TokenStatus.CALLED,
        ];
        const tokenStatus = tokenStatusPool[tokenCounter % tokenStatusPool.length];

        tokens.push({
          tokenNumber: `A-${String(tokenCounter).padStart(3, '0')}`,
          qrCode: 'data:image/png;base64,MOCK',
          qrData: JSON.stringify({ token: tokenCounter }),
          status: tokenStatus,
          priority: Priority.NORMAL,
          citizenId: citizen.id,
          officeId: office.id,
          serviceId: service.id,
          estimatedWaitTime: 15,
          actualWaitTime: tokenStatus === TokenStatus.COMPLETED ? 12 + (tokenCounter % 8) : undefined,
          calledAt: tokenStatus === TokenStatus.CALLED ? new Date(date.getTime() + 30 * 60 * 1000) : undefined,
          servedAt: tokenStatus === TokenStatus.COMPLETED ? new Date(date.getTime() + 40 * 60 * 1000) : undefined,
          completedAt: tokenStatus === TokenStatus.COMPLETED ? new Date(date.getTime() + 55 * 60 * 1000) : undefined,
        });

        appointmentCounter += 1;
        tokenCounter += 1;
      }
    }

    const savedAppointments = await this.appointmentRepository.save(appointments);
    const savedTokens = await this.tokenRepository.save(tokens);

    for (let i = 0; i < savedTokens.length; i += 1) {
      const dateOffset = Math.floor(i / citizens.length);
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - dateOffset);
      createdAt.setHours(9 + (i % 8), 0, 0, 0);
      await this.tokenRepository.update(savedTokens[i].id, { createdAt });
    }

    for (let i = 0; i < savedAppointments.length; i += 1) {
      const dateOffset = Math.floor(i / citizens.length);
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - dateOffset);
      createdAt.setHours(8 + (i % 8), 0, 0, 0);
      await this.appointmentRepository.update(savedAppointments[i].id, { createdAt });
    }

    this.logger.log('Seeded mock analytics data', 'AnalyticsService');
  }

  async getDashboardMetrics(officeId?: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tokenWhere: any = officeId ? { officeId } : {};
    const appointmentWhere: any = officeId ? { officeId } : {};

    const [
      totalTokens,
      todayTokens,
      completedTokens,
      waitingTokens,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      this.tokenRepository.count({ where: tokenWhere }),
      this.tokenRepository
        .createQueryBuilder('t')
        .where(officeId ? 't.officeId = :officeId' : '1=1', { officeId })
        .andWhere('t.createdAt >= :today', { today })
        .andWhere('t.createdAt < :tomorrow', { tomorrow })
        .getCount(),
      this.tokenRepository.count({ where: { ...tokenWhere, status: TokenStatus.COMPLETED } }),
      this.tokenRepository.count({ where: { ...tokenWhere, status: TokenStatus.WAITING } }),
      this.appointmentRepository.count({ where: appointmentWhere }),
      this.appointmentRepository.count({ where: { ...appointmentWhere, scheduledDate: today } }),
      this.appointmentRepository.count({ where: { ...appointmentWhere, status: AppointmentStatus.COMPLETED } }),
      this.appointmentRepository.count({ where: { ...appointmentWhere, status: AppointmentStatus.CANCELLED } }),
    ]);

    const completionRate = totalTokens > 0
      ? parseFloat((completedTokens / totalTokens * 100).toFixed(1))
      : 0;

    const cancelRate = totalAppointments > 0
      ? parseFloat((cancelledAppointments / totalAppointments * 100).toFixed(1))
      : 0;

    // Avg wait time from completed tokens
    const completedWithWait = await this.tokenRepository
      .createQueryBuilder('t')
      .select('AVG(t.actualWaitTime)', 'avg')
      .where(officeId ? 't.officeId = :officeId' : '1=1', { officeId })
      .andWhere('t.status = :status', { status: TokenStatus.COMPLETED })
      .andWhere('t.actualWaitTime IS NOT NULL')
      .getRawOne();

    const avgWaitTime = parseFloat(completedWithWait?.avg || '0').toFixed(1);

    return {
      totalTokens,
      todayTokens,
      completedTokens,
      waitingTokens,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate,
      cancelRate,
      avgWaitTime,
    };
  }

  async getQueueAnalytics(officeId: string, startDate: string, endDate: string): Promise<any> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dailyData = await this.tokenRepository
      .createQueryBuilder('t')
      .select("DATE(t.createdAt)", 'date')
      .addSelect("COUNT(*)", 'total')
      .addSelect("SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END)", 'completed')
      .addSelect("SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END)", 'cancelled')
      .addSelect('AVG(t.actualWaitTime)', 'avgWaitTime')
      .where('t.officeId = :officeId', { officeId })
      .andWhere('t.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("DATE(t.createdAt)")
      .orderBy("DATE(t.createdAt)", 'ASC')
      .getRawMany();

    return { dailyData, period: { startDate, endDate } };
  }

  async getServicePerformance(officeId?: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.tokenRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.service', 'service')
      .select('service.name', 'serviceName')
      .addSelect('service.id', 'serviceId')
      .addSelect('COUNT(t.id)', 'totalServed')
      .addSelect('AVG(t.actualWaitTime)', 'avgDuration')
      .addSelect("SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END)", 'completed')
      .groupBy('service.id')
      .addGroupBy('service.name');

    if (officeId) query.where('t.officeId = :officeId', { officeId });
    if (startDate) query.andWhere('t.createdAt >= :start', { start: new Date(startDate) });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('t.createdAt <= :end', { end });
    }

    return query.getRawMany();
  }

  async getAppointmentStats(officeId?: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.appointmentRepository.createQueryBuilder('a');

    if (officeId) query.where('a.officeId = :officeId', { officeId });
    if (startDate) query.andWhere('a.scheduledDate >= :start', { start: new Date(startDate) });
    if (endDate) query.andWhere('a.scheduledDate <= :end', { end: new Date(endDate) });

    const [total, completed, cancelled, scheduled, inProgress] = await Promise.all([
      query.clone().getCount(),
      query.clone().andWhere('a.status = :s', { s: AppointmentStatus.COMPLETED }).getCount(),
      query.clone().andWhere('a.status = :s', { s: AppointmentStatus.CANCELLED }).getCount(),
      query.clone().andWhere('a.status = :s', { s: AppointmentStatus.SCHEDULED }).getCount(),
      query.clone().andWhere('a.status = :s', { s: AppointmentStatus.IN_PROGRESS }).getCount(),
    ]);

    return {
      total,
      completed,
      cancelled,
      scheduled,
      inProgress,
      noShow: 0,
      completionRate: total > 0 ? parseFloat((completed / total * 100).toFixed(1)) : 0,
    };
  }

  async getPeakHours(officeId: string, startDate?: string, endDate?: string): Promise<any> {
    const query = this.tokenRepository
      .createQueryBuilder('t')
      .select('EXTRACT(HOUR FROM t.createdAt)', 'hour')
      .addSelect('COUNT(t.id)', 'count')
      .where('t.officeId = :officeId', { officeId })
      .groupBy('EXTRACT(HOUR FROM t.createdAt)')
      .orderBy('EXTRACT(HOUR FROM t.createdAt)', 'ASC');

    if (startDate) query.andWhere('t.createdAt >= :start', { start: new Date(startDate) });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('t.createdAt <= :end', { end });
    }

    const hourlyData = await query.getRawMany();
    return { hourlyDistribution: hourlyData };
  }

  async getOfficeSummary(officeId: string): Promise<any> {
    const [metrics, servicePerf, peakHours, appointmentStats] = await Promise.all([
      this.getDashboardMetrics(officeId),
      this.getServicePerformance(officeId),
      this.getPeakHours(officeId),
      this.getAppointmentStats(officeId),
    ]);

    return {
      officeId,
      metrics,
      servicePerformance: servicePerf,
      peakHours,
      appointmentStats,
      generatedAt: new Date().toISOString(),
    };
  }
}
