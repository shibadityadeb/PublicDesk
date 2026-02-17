import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@modules/user/entities';
import { RegisterDto, LoginDto } from '../dto';
import { OtpService } from './otp.service';
import { AppLoggerService } from '@common/logger/logger.service';
import { UserStatus } from '@common/enums';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
}

/**
 * Auth Response interface
 */
export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication Service
 * Handles user registration, login, JWT token generation, and OTP verification
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, phone, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
      phoneVerified: false,
    });

    await this.userRepository.save(user);

    // Generate OTP for email verification
    const otp = await this.otpService.createOtp(user, 'EMAIL_VERIFICATION', 'Account verification');
    await this.otpService.sendOtpEmail(user.email, otp.code, 'Email Verification');

    this.logger.log(`User registered successfully: ${user.email}`, 'AuthService');

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto, ip?: string): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'status', 'emailVerified'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Account is suspended or inactive');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
      lastLoginIp: ip,
    });

    this.logger.log(`User logged in: ${user.email}`, 'AuthService');

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(userId: string, code: string): Promise<void> {
    const isValid = await this.otpService.verifyOtp(userId, code, 'EMAIL_VERIFICATION');

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user email verification status
    await this.userRepository.update(userId, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });

    this.logger.log(`Email verified for user: ${userId}`, 'AuthService');
  }

  /**
   * Resend OTP for email verification
   */
  async resendEmailOtp(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = await this.otpService.createOtp(user, 'EMAIL_VERIFICATION', 'Email Verification');
    await this.otpService.sendOtpEmail(user.email, otp.code, 'Email Verification');

    this.logger.log(`Email OTP resent for user: ${user.email}`, 'AuthService');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'email', 'role', 'refreshToken'],
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify stored refresh token
      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: undefined });
    this.logger.log(`User logged out: ${userId}`, 'AuthService');
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Update refresh token in database (hashed)
   */
  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hashedToken });
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): Partial<User> {
    const { password, refreshToken, ...sanitized } = user as any;
    return sanitized;
  }
}
