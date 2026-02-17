import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Otp, User } from '@modules/user/entities';
import { AppLoggerService } from '@common/logger/logger.service';

/**
 * OTP Service
 * Handles OTP generation, verification, and management
 */
@Injectable()
export class OtpService {
  private readonly otpLength: number;
  private readonly otpExpiryMinutes: number;
  private readonly maxAttempts = 5;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.otpLength = this.configService.get<number>('otp.length') || 6;
    this.otpExpiryMinutes = this.configService.get<number>('otp.expiryMinutes') || 5;
  }

  /**
   * Generate a random OTP code
   */
  private generateCode(): string {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Create and save an OTP for a user
   */
  async createOtp(user: User, type: string, purpose?: string): Promise<Otp> {
    // Invalidate any existing unverified OTPs for this user and type
    await this.otpRepository.update(
      {
        user: { id: user.id },
        type,
        verified: false,
      },
      {
        verified: true, // Mark as verified to invalidate
      },
    );

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiryMinutes);

    const otp = this.otpRepository.create({
      user,
      code,
      type,
      purpose,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    await this.otpRepository.save(otp);

    this.logger.log(`OTP created for user ${user.email}, type: ${type}`, 'OtpService');

    return otp;
  }

  /**
   * Verify an OTP code
   */
  async verifyOtp(userId: string, code: string, type: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        user: { id: userId },
        type,
        verified: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otp) {
      throw new BadRequestException('No valid OTP found');
    }

    // Check if OTP has expired
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    // Check max attempts
    if (otp.attempts >= this.maxAttempts) {
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    // Increment attempts
    otp.attempts += 1;
    await this.otpRepository.save(otp);

    // Verify code
    if (otp.code !== code) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark as verified
    otp.verified = true;
    await this.otpRepository.save(otp);

    this.logger.log(`OTP verified for user ${userId}, type: ${type}`, 'OtpService');

    return true;
  }

  /**
   * Send OTP via email (stub implementation)
   */
  async sendOtpEmail(email: string, code: string, purpose: string): Promise<void> {
    // TODO: Implement actual email sending logic
    this.logger.log(
      `[STUB] Sending OTP ${code} to email ${email} for ${purpose}`,
      'OtpService',
    );
    // In production, integrate with nodemailer or email service
  }

  /**
   * Send OTP via SMS (stub implementation)
   */
  async sendOtpSms(phone: string, code: string, purpose: string): Promise<void> {
    // TODO: Implement actual SMS sending logic
    this.logger.log(`[STUB] Sending OTP ${code} to phone ${phone} for ${purpose}`, 'OtpService');
    // In production, integrate with Twilio or SMS service
  }

  /**
   * Clean up expired OTPs (can be run as a cron job)
   */
  async cleanupExpiredOtps(): Promise<void> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired OTPs`, 'OtpService');
  }
}
