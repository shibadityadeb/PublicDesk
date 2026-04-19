import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { OfficeStatus } from '@common/enums';

@Entity('offices')
@Index(['code'], { unique: true })
@Index(['city'])
export class Office extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 10 })
  pincode: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'enum', enum: OfficeStatus, default: OfficeStatus.ACTIVE })
  status: OfficeStatus;

  @Column({ type: 'varchar', length: 10, name: 'opening_time', default: '09:00' })
  openingTime: string;

  @Column({ type: 'varchar', length: 10, name: 'closing_time', default: '17:00' })
  closingTime: string;

  @Column({ type: 'jsonb', name: 'working_days', default: ['MON', 'TUE', 'WED', 'THU', 'FRI'] })
  workingDays: string[];

  @Column({ type: 'int', name: 'max_capacity', default: 500 })
  maxCapacity: number;

  @Column({ type: 'int', name: 'current_capacity', default: 0 })
  currentCapacity: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
