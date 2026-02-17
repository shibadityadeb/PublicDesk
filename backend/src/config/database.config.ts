import { registerAs } from '@nestjs/config';

/**
 * Database configuration
 * Loads PostgreSQL connection settings from environment variables
 */
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'publicdesk',
  password: process.env.DB_PASSWORD || 'publicdesk123',
  database: process.env.DB_DATABASE || 'publicdesk_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));
