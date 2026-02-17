import { registerAs } from '@nestjs/config';

/**
 * RabbitMQ configuration
 * Loads RabbitMQ connection settings for async messaging
 */
export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || 'publicdesk',
}));
