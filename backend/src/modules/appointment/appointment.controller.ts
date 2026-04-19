import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiSwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(UserRole.CITIZEN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Book a new appointment' })
  async create(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
    const result = await this.appointmentService.create(user.id, dto);
    return ApiResponse.success('Appointment booked successfully', result);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN, UserRole.CITIZEN)
  @ApiOperation({ summary: 'Get appointments (admin: all, citizen: own)' })
  async findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    const result = user.role === UserRole.CITIZEN
      ? await this.appointmentService.findByCitizen(user.id, pagination)
      : await this.appointmentService.findAll(pagination);
    return ApiResponse.success('Appointments retrieved successfully', result);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user appointments' })
  async findMy(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    const result = await this.appointmentService.findByCitizen(user.id, pagination);
    return ApiResponse.success('Appointments retrieved successfully', result);
  }

  @Get('office/:officeId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get appointments for a specific office' })
  async findByOffice(
    @Param('officeId') officeId: string,
    @Query('date') date?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const result = await this.appointmentService.findByOffice(officeId, date, pagination);
    return ApiResponse.success('Appointments retrieved successfully', result);
  }

  @Get('slots/:officeId/:serviceId/:date')
  @ApiOperation({ summary: 'Get available time slots for booking' })
  async getSlots(
    @Param('officeId') officeId: string,
    @Param('serviceId') serviceId: string,
    @Param('date') date: string,
  ) {
    const result = await this.appointmentService.getAvailableSlots(officeId, serviceId, date);
    return ApiResponse.success('Available slots retrieved', result);
  }

  @Get('office/:officeId/today-stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OFFICER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get today's appointment statistics for an office" })
  async getTodayStats(@Param('officeId') officeId: string) {
    const result = await this.appointmentService.getTodayStats(officeId);
    return ApiResponse.success('Today statistics retrieved', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.appointmentService.findById(id);
    return ApiResponse.success('Appointment retrieved successfully', result);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CancelAppointmentDto,
  ) {
    const result = await this.appointmentService.cancel(id, user, dto);
    return ApiResponse.success('Appointment cancelled successfully', result);
  }

  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule an appointment' })
  async reschedule(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const result = await this.appointmentService.reschedule(id, user, dto);
    return ApiResponse.success('Appointment rescheduled successfully', result);
  }

  @Patch(':id/checkin')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in an appointment' })
  async checkIn(@Param('id') id: string) {
    const result = await this.appointmentService.checkIn(id);
    return ApiResponse.success('Appointment checked in', result);
  }

  @Patch(':id/complete')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark appointment as completed' })
  async complete(@Param('id') id: string) {
    const result = await this.appointmentService.complete(id);
    return ApiResponse.success('Appointment completed', result);
  }
}
