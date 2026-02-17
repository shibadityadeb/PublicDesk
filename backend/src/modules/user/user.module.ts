import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, Otp } from './entities';

/**
 * User Module
 * Provides user management functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
