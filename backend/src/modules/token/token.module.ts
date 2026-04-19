import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { Token } from './entities';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [TypeOrmModule.forFeature([Token]), GatewaysModule],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
