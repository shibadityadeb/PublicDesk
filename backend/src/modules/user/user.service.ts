import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities';
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ChangePasswordDto,
} from './dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { UserRole } from '@common/enums';

/**
 * User Service
 * Handles user management operations
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Get all users with pagination
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole, paginationDto: PaginationDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      where: { role },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
      // If email changed, mark as unverified
      user.emailVerified = false;
    }

    // Check if phone is being changed and if it's already taken
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
      user.phoneVerified = false;
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    this.logger.log(`User profile updated: ${id}`, 'UserService');

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.userRepository.update(id, { password: hashedPassword });

    this.logger.log(`Password changed for user: ${id}`, 'UserService');
  }

  /**
   * Update user role (Admin only)
   */
  async updateRole(id: string, updateRoleDto: UpdateUserRoleDto): Promise<User> {
    const user = await this.findById(id);

    user.role = updateRoleDto.role;
    await this.userRepository.save(user);

    this.logger.log(`User role updated: ${id} -> ${updateRoleDto.role}`, 'UserService');

    return user;
  }

  /**
   * Update user status (Admin only)
   */
  async updateStatus(id: string, updateStatusDto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findById(id);

    user.status = updateStatusDto.status;
    await this.userRepository.save(user);

    this.logger.log(`User status updated: ${id} -> ${updateStatusDto.status}`, 'UserService');

    return user;
  }

  /**
   * Delete user (soft delete)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    await this.userRepository.softRemove(user);

    this.logger.log(`User deleted: ${id}`, 'UserService');
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<any> {
    const total = await this.userRepository.count();
    const byRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role, COUNT(*) as count')
      .groupBy('user.role')
      .getRawMany();

    const byStatus = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status, COUNT(*) as count')
      .groupBy('user.status')
      .getRawMany();

    return {
      total,
      byRole,
      byStatus,
    };
  }
}
