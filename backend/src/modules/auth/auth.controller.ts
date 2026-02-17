import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiSwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto } from './dto';
import { Public, CurrentUser } from '@common/decorators';
import { JwtAuthGuard } from '@common/guards';
import { ApiResponse } from '@common/dto';
import { Request } from 'express';

/**
 * Authentication Controller
 * Handles user registration, login, OTP verification, and token management
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiSwaggerResponse({ status: 201, description: 'User registered successfully' })
  @ApiSwaggerResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ApiResponse.success('User registered successfully. Please verify your email.', result);
  }

  /**
   * Login user
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiSwaggerResponse({ status: 200, description: 'Login successful' })
  @ApiSwaggerResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.connection.remoteAddress;
    const result = await this.authService.login(loginDto, ip);
    return ApiResponse.success('Login successful', result);
  }

  /**
   * Verify email with OTP
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiSwaggerResponse({ status: 200, description: 'Email verified successfully' })
  @ApiSwaggerResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyEmail(@CurrentUser('id') userId: string, @Body() verifyOtpDto: VerifyOtpDto) {
    await this.authService.verifyEmail(userId, verifyOtpDto.code);
    return ApiResponse.success('Email verified successfully');
  }

  /**
   * Resend email verification OTP
   */
  @UseGuards(JwtAuthGuard)
  @Post('resend-email-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiSwaggerResponse({ status: 200, description: 'OTP sent successfully' })
  async resendEmailOtp(@CurrentUser('id') userId: string) {
    await this.authService.resendEmailOtp(userId);
    return ApiResponse.success('OTP sent to your email');
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiSwaggerResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiSwaggerResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return ApiResponse.success('Token refreshed successfully', tokens);
  }

  /**
   * Logout user
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiSwaggerResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return ApiResponse.success('Logged out successfully');
  }

  /**
   * Get current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSwaggerResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser() user: any) {
    return ApiResponse.success('Profile retrieved', user);
  }
}
