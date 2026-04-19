import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '@common/logger/logger.service';
import { Token } from '@modules/token/entities/token.entity';
import { Appointment } from '@modules/appointment/entities/appointment.entity';
import { TokenStatus, AppointmentStatus } from '@common/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly logger: AppLoggerService,
  ) {}

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
