import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { NotificationType, NotificationStatus } from '@common/enums';

@Entity('notifications')
@Index(['recipientId'])
@Index(['status'])
export class Notification extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'recipient_email' })
  recipientEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recipient_phone' })
  recipientPhone?: string;

  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'template_name' })
  templateName?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
