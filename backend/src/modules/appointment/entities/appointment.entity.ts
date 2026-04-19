import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { AppointmentStatus, Priority } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';
import { Office } from '@modules/office/entities/office.entity';
import { Service } from '@modules/service/entities/service.entity';

@Entity('appointments')
@Index(['appointmentNumber'], { unique: true })
@Index(['citizenId'])
@Index(['officeId'])
@Index(['scheduledDate'])
@Index(['status'])
export class Appointment extends BaseEntity {
  @Column({ type: 'varchar', length: 30, unique: true, name: 'appointment_number' })
  appointmentNumber: string;

  @Column({ type: 'uuid', name: 'citizen_id' })
  citizenId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citizen_id' })
  citizen: User;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'uuid', name: 'office_id' })
  officeId: string;

  @ManyToOne(() => Office, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate: Date;

  @Column({ type: 'varchar', length: 10, name: 'scheduled_time' })
  scheduledTime: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.NORMAL })
  priority: Priority;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string;

  @Column({ type: 'uuid', nullable: true, name: 'token_id' })
  tokenId?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'checked_in_at' })
  checkedInAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
