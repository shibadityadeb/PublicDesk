import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsArray, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfficeStatus } from '@common/enums';

export class CreateOfficeDto {
  @ApiProperty({ example: 'Regional Passport Office - Mumbai' })
  @IsString()
  @Length(3, 200)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '1st Floor, Maker Chambers, Nariman Point' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ example: '400021' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode: string;

  @ApiProperty({ example: '+912222881234' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'rpo.mumbai@gov.in' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: OfficeStatus, default: OfficeStatus.ACTIVE })
  @IsEnum(OfficeStatus)
  @IsOptional()
  status?: OfficeStatus;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  openingTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsString()
  @IsOptional()
  closingTime?: string;

  @ApiPropertyOptional({ example: ['MON', 'TUE', 'WED', 'THU', 'FRI'] })
  @IsArray()
  @IsOptional()
  workingDays?: string[];

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  maxCapacity?: number;
}
