import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { ServiceStatus } from '@common/enums';
import { Office } from '@modules/office/entities/office.entity';

@Entity('services')
@Index(['code'], { unique: true })
@Index(['officeId'])
@Index(['category'])
export class Service extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Column({ type: 'int', name: 'estimated_duration', default: 15 })
  estimatedDuration: number;

  @Column({ type: 'int', name: 'max_daily_capacity', default: 100 })
  maxDailyCapacity: number;

  @Column({ type: 'boolean', name: 'requires_appointment', default: false })
  requiresAppointment: boolean;

  @Column({ type: 'boolean', name: 'requires_documents', default: false })
  requiresDocuments: boolean;

  @Column({ type: 'jsonb', name: 'document_list', nullable: true })
  documentList?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fees: number;

  @Column({ type: 'uuid', name: 'office_id' })
  officeId: string;

  @ManyToOne(() => Office, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
