import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { TokenStatus, Priority } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';
import { Office } from '@modules/office/entities/office.entity';
import { Service } from '@modules/service/entities/service.entity';

@Entity('tokens')
@Index(['tokenNumber'])
@Index(['officeId', 'createdAt'])
@Index(['citizenId'])
@Index(['status'])
export class Token extends BaseEntity {
  @Column({ type: 'varchar', length: 20, name: 'token_number' })
  tokenNumber: string;

  @Column({ type: 'text', name: 'qr_code' })
  qrCode: string;

  @Column({ type: 'text', name: 'qr_data' })
  qrData: string;

  @Column({ type: 'enum', enum: TokenStatus, default: TokenStatus.WAITING })
  status: TokenStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.NORMAL })
  priority: Priority;

  @Column({ type: 'uuid', nullable: true, name: 'appointment_id' })
  appointmentId?: string;

  @Column({ type: 'uuid', name: 'citizen_id' })
  citizenId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citizen_id' })
  citizen: User;

  @Column({ type: 'uuid', name: 'office_id' })
  officeId: string;

  @ManyToOne(() => Office, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'uuid', nullable: true, name: 'counter_id' })
  counterId?: string;

  @Column({ type: 'int', nullable: true, name: 'counter_number' })
  counterNumber?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'called_at' })
  calledAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'served_at' })
  servedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Column({ type: 'int', nullable: true, name: 'estimated_wait_time' })
  estimatedWaitTime?: number;

  @Column({ type: 'int', nullable: true, name: 'actual_wait_time' })
  actualWaitTime?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
