import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { CounterStatus } from '@common/enums';
import { Office } from './office.entity';

@Entity('counters')
@Index(['officeId'])
export class Counter extends BaseEntity {
  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CounterStatus, default: CounterStatus.OFFLINE })
  status: CounterStatus;

  @Column({ type: 'uuid', name: 'office_id' })
  officeId: string;

  @ManyToOne(() => Office, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @Column({ type: 'uuid', nullable: true, name: 'current_officer_id' })
  currentOfficerId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'service_id' })
  serviceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
