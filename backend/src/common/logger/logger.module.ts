import { Module, Global } from '@nestjs/common';
import { AppLoggerService } from './logger.service';

/**
 * Global Logger Module
 * Provides centralized logging service across the application
 */
@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
