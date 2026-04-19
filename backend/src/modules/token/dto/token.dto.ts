import { IsString, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, TokenStatus } from '@common/enums';

export class GenerateTokenDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  officeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NORMAL })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTokenStatusDto {
  @ApiProperty({ enum: TokenStatus })
  @IsEnum(TokenStatus)
  status: TokenStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  counterId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  counterNumber?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CallNextDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @ApiProperty()
  @IsUUID()
  counterId: string;

  @ApiProperty()
  @IsNumber()
  counterNumber: number;
}
