import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLoggerService } from '@common/logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/queue',
})
export class QueueGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly logger: AppLoggerService) {}

  afterInit(server: Server): void {
    this.logger.log('QueueGateway initialized', 'QueueGateway');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`, 'QueueGateway');
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`, 'QueueGateway');
  }

  @SubscribeMessage('subscribe:office')
  handleJoinOffice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { officeId: string },
  ): void {
    const room = `office:${data.officeId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`, 'QueueGateway');
    client.emit('subscribed', { room, message: `Subscribed to office ${data.officeId} updates` });
  }

  @SubscribeMessage('unsubscribe:office')
  handleLeaveOffice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { officeId: string },
  ): void {
    const room = `office:${data.officeId}`;
    client.leave(room);
    client.emit('unsubscribed', { room });
  }

  @SubscribeMessage('subscribe:token')
  handleSubscribeToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokenId: string },
  ): void {
    const room = `token:${data.tokenId}`;
    client.join(room);
    client.emit('subscribed', { room, message: `Subscribed to token ${data.tokenId} updates` });
  }

  /**
   * Emit queue update to all clients in office room
   */
  emitQueueUpdate(officeId: string, data: any): void {
    this.server.to(`office:${officeId}`).emit('queue:updated', data);
  }

  /**
   * Emit token called event to office room
   */
  emitTokenCalled(officeId: string, tokenData: {
    tokenId: string;
    tokenNumber: string;
    counterNumber: number;
    citizenId: string;
  }): void {
    // Broadcast to entire office room
    this.server.to(`office:${officeId}`).emit('token:called', tokenData);
    // Also send to specific token room
    this.server.to(`token:${tokenData.tokenId}`).emit('token:called', tokenData);
  }

  /**
   * Emit position update to specific token subscriber
   */
  emitPositionUpdate(tokenId: string, data: { position: number; estimatedWait: number }): void {
    this.server.to(`token:${tokenId}`).emit('token:position-update', data);
  }

  /**
   * Emit queue statistics to office room
   */
  emitQueueStats(officeId: string, stats: any): void {
    this.server.to(`office:${officeId}`).emit('queue:stats', stats);
  }

  /**
   * Emit token completion notification
   */
  emitTokenCompleted(officeId: string, tokenId: string): void {
    this.server.to(`office:${officeId}`).emit('token:completed', { tokenId });
    this.server.to(`token:${tokenId}`).emit('token:completed', { tokenId });
  }
}
