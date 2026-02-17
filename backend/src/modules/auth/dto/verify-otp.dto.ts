import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Verify OTP DTO
 * Used to verify OTP codes
 */
export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 10)
  code: string;

  @ApiProperty({ example: 'EMAIL_VERIFICATION' })
  @IsString()
  type: string;
}
