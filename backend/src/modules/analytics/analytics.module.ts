import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Token } from '@modules/token/entities/token.entity';
import { Appointment } from '@modules/appointment/entities/appointment.entity';
import { Office } from '@modules/office/entities/office.entity';
import { Service } from '@modules/service/entities/service.entity';
import { User } from '@modules/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token, Appointment, Office, Service, User])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
