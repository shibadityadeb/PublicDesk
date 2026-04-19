import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@common/enums';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  officeId: string;

  @ApiProperty({ example: '2026-04-25' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  scheduledTime: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NORMAL })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Personal emergency' })
  @IsString()
  reason: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-04-28' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  scheduledTime: string;
}
