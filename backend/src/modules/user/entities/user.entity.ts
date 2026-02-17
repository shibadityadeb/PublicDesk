import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities';
import { UserRole, UserStatus } from '@common/enums';

/**
 * User Entity
 * Stores user account information with authentication details
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CITIZEN,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'profile_picture' })
  profilePicture?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_login_ip' })
  lastLoginIp?: string;

  // Refresh token for JWT authentication
  @Column({ type: 'text', nullable: true, name: 'refresh_token', select: false })
  refreshToken?: string;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
