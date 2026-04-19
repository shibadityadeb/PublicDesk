import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CounterStatus } from '@common/enums';

export class CreateCounterDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  number: number;

  @ApiProperty({ example: 'Counter 1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: CounterStatus })
  @IsEnum(CounterStatus)
  @IsOptional()
  status?: CounterStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  serviceId?: string;
}

export class UpdateCounterDto {
  @ApiPropertyOptional({ example: 'Counter 1 - Documents' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CounterStatus })
  @IsEnum(CounterStatus)
  @IsOptional()
  status?: CounterStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  serviceId?: string;
}

export class AssignOfficerDto {
  @ApiProperty()
  @IsUUID()
  officerId: string;
}
