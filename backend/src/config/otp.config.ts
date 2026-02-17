import { registerAs } from '@nestjs/config';

/**
 * OTP configuration
 * Loads OTP settings for two-factor authentication
 */
export const otpConfig = registerAs('otp', () => ({
  secret: process.env.OTP_SECRET || 'your-otp-secret-key',
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  length: parseInt(process.env.OTP_LENGTH || '6', 10),
}));
