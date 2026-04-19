import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@common/enums';

export class CreateServiceDto {
  @ApiProperty({ example: 'Passport Application' })
  @IsString()
  @Length(3, 200)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'IDENTITY' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiPropertyOptional({ example: 20, description: 'Estimated duration in minutes' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsNumber()
  @IsOptional()
  maxDailyCapacity?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  requiresAppointment?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  requiresDocuments?: boolean;

  @ApiPropertyOptional({ example: ['Aadhaar Card', 'Birth Certificate'] })
  @IsArray()
  @IsOptional()
  documentList?: string[];

  @ApiPropertyOptional({ example: 1500 })
  @IsNumber()
  @IsOptional()
  fees?: number;

  @ApiProperty({ description: 'Office ID this service belongs to' })
  @IsUUID()
  officeId: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxDailyCapacity?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresAppointment?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresDocuments?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  documentList?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  fees?: number;
}
