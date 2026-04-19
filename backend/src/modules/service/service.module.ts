import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from './service.controller';
import { ServiceCatalogService } from './service.service';
import { Service } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServiceController],
  providers: [ServiceCatalogService],
  exports: [ServiceCatalogService],
})
export class ServiceModule {}
