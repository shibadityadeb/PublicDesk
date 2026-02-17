import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { User } from './user.entity';

/**
 * OTP Entity
 * Stores OTP codes for email/phone verification and authentication
 */
@Entity('otps')
@Index(['user', 'type', 'expiresAt'])
export class Otp extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // EMAIL_VERIFICATION, PHONE_VERIFICATION, LOGIN, PASSWORD_RESET

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purpose?: string;

  @Column({ type: 'int', default: 0, name: 'attempts' })
  attempts: number;
}
