import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse } from '@common/dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPI metrics' })
  @ApiQuery({ name: 'officeId', required: false })
  async getDashboard(@Query('officeId') officeId?: string) {
    const result = await this.analyticsService.getDashboardMetrics(officeId);
    return ApiResponse.success('Dashboard metrics retrieved', result);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get queue analytics for date range' })
  @ApiQuery({ name: 'officeId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getQueueAnalytics(
    @Query('officeId') officeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const result = await this.analyticsService.getQueueAnalytics(officeId, startDate, endDate);
    return ApiResponse.success('Queue analytics retrieved', result);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get per-service performance metrics' })
  async getServicePerformance(
    @Query('officeId') officeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.analyticsService.getServicePerformance(officeId, startDate, endDate);
    return ApiResponse.success('Service performance retrieved', result);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointment statistics' })
  async getAppointmentStats(
    @Query('officeId') officeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.analyticsService.getAppointmentStats(officeId, startDate, endDate);
    return ApiResponse.success('Appointment statistics retrieved', result);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Get peak hour distribution' })
  @ApiQuery({ name: 'officeId', required: true })
  async getPeakHours(
    @Query('officeId') officeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.analyticsService.getPeakHours(officeId, startDate, endDate);
    return ApiResponse.success('Peak hours retrieved', result);
  }

  @Get('office/:officeId/summary')
  @ApiOperation({ summary: 'Get comprehensive office summary' })
  async getOfficeSummary(@Param('officeId') officeId: string) {
    const result = await this.analyticsService.getOfficeSummary(officeId);
    return ApiResponse.success('Office summary retrieved', result);
  }
}
