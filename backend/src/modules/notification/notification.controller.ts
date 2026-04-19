import { Controller, Get, Patch, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user notifications' })
  async getMyNotifications(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    const result = await this.notificationService.getNotifications(user.id, pagination);
    return ApiResponse.success('Notifications retrieved', result);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    const result = await this.notificationService.markAsRead(id);
    return ApiResponse.success('Notification marked as read', result);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all notifications (admin)' })
  async getAllNotifications(@Query() pagination: PaginationDto) {
    const result = await this.notificationService.getAllNotifications(pagination);
    return ApiResponse.success('Notifications retrieved', result);
  }
}
