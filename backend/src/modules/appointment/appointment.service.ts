import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto, CancelAppointmentDto, RescheduleAppointmentDto } from './dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { AppointmentStatus, UserRole } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly logger: AppLoggerService,
  ) {}

  private generateAppointmentNumber(): string {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 9000 + 1000);
    return `APT-${datePart}-${randomPart}`;
  }

  async create(citizenId: string, dto: CreateAppointmentDto): Promise<Appointment> {
    // Check for duplicate appointment on same date/time
    const existing = await this.appointmentRepository.findOne({
      where: {
        citizenId,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledTime: dto.scheduledTime,
        serviceId: dto.serviceId,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    if (existing) {
      throw new BadRequestException('You already have an appointment at this time for this service');
    }

    const appointmentNumber = this.generateAppointmentNumber();

    const appointment = this.appointmentRepository.create({
      ...dto,
      citizenId,
      appointmentNumber,
      scheduledDate: new Date(dto.scheduledDate),
      status: AppointmentStatus.SCHEDULED,
    });

    await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment created: ${appointmentNumber}`, 'AppointmentService');
    return appointment;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.appointmentRepository.findAndCount({
      skip,
      take: limit,
      relations: ['citizen', 'service', 'office'],
      order: { scheduledDate: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByCitizen(citizenId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.appointmentRepository.findAndCount({
      where: { citizenId },
      skip,
      take: limit,
      relations: ['service', 'office'],
      order: { scheduledDate: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByOffice(
    officeId: string,
    date?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const whereClause: any = { officeId };
    if (date) {
      whereClause.scheduledDate = new Date(date);
    }

    const [data, total] = await this.appointmentRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      relations: ['citizen', 'service'],
      order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['citizen', 'service', 'office'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async cancel(id: string, user: User, dto: CancelAppointmentDto): Promise<Appointment> {
    const appointment = await this.findById(id);

    const canCancel =
      appointment.citizenId === user.id ||
      [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN].includes(user.role as UserRole);

    if (!canCancel) throw new ForbiddenException('You cannot cancel this appointment');

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot cancel an appointment with status: ${appointment.status}`);
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = dto.reason;
    await this.appointmentRepository.save(appointment);

    this.logger.log(`Appointment ${id} cancelled`, 'AppointmentService');
    return appointment;
  }

  async reschedule(id: string, user: User, dto: RescheduleAppointmentDto): Promise<Appointment> {
    const appointment = await this.findById(id);

    const canReschedule =
      appointment.citizenId === user.id ||
      [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN].includes(user.role as UserRole);

    if (!canReschedule) throw new ForbiddenException('You cannot reschedule this appointment');

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Can only reschedule SCHEDULED appointments');
    }

    appointment.scheduledDate = new Date(dto.scheduledDate);
    appointment.scheduledTime = dto.scheduledTime;
    await this.appointmentRepository.save(appointment);

    this.logger.log(`Appointment ${id} rescheduled`, 'AppointmentService');
    return appointment;
  }

  async checkIn(id: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED && appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Appointment is not in a valid state for check-in');
    }

    appointment.status = AppointmentStatus.IN_PROGRESS;
    appointment.checkedInAt = new Date();
    await this.appointmentRepository.save(appointment);

    this.logger.log(`Appointment ${id} checked in`, 'AppointmentService');
    return appointment;
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException('Appointment is not in progress');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();
    await this.appointmentRepository.save(appointment);

    this.logger.log(`Appointment ${id} completed`, 'AppointmentService');
    return appointment;
  }

  async getAvailableSlots(officeId: string, serviceId: string, date: string): Promise<string[]> {
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30',
    ];

    const bookedAppointments = await this.appointmentRepository.find({
      where: {
        officeId,
        serviceId,
        scheduledDate: new Date(date),
        status: AppointmentStatus.SCHEDULED,
      },
      select: ['scheduledTime'],
    });

    const bookedSlots = new Set(bookedAppointments.map(a => a.scheduledTime));
    return slots.filter(slot => !bookedSlots.has(slot));
  }

  async getTodayStats(officeId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, completed, cancelled, scheduled] = await Promise.all([
      this.appointmentRepository.count({ where: { officeId, scheduledDate: today } }),
      this.appointmentRepository.count({ where: { officeId, scheduledDate: today, status: AppointmentStatus.COMPLETED } }),
      this.appointmentRepository.count({ where: { officeId, scheduledDate: today, status: AppointmentStatus.CANCELLED } }),
      this.appointmentRepository.count({ where: { officeId, scheduledDate: today, status: AppointmentStatus.SCHEDULED } }),
    ]);

    return { total, completed, cancelled, scheduled, completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0 };
  }
}
