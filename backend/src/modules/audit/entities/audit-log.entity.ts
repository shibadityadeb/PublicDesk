import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities';

@Entity('audit_logs')
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['action'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_state' })
  previousState?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_state' })
  newState?: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
