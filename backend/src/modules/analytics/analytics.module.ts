import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Token } from '@modules/token/entities/token.entity';
import { Appointment } from '@modules/appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token, Appointment])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
