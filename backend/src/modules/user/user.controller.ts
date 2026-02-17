import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiSwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  ChangePasswordDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';

/**
 * User Controller
 * Handles user management endpoints
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get all users (Admin only)
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiSwaggerResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.userService.findAll(paginationDto);
    return ApiResponse.success('Users retrieved successfully', result);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSwaggerResponse({ status: 200, description: 'Profile retrieved' })
  async getMyProfile(@CurrentUser() user: any) {
    return ApiResponse.success('Profile retrieved', user);
  }

  /**
   * Get user statistics (Admin only)
   */
  @Get('statistics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiSwaggerResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    const stats = await this.userService.getStatistics();
    return ApiResponse.success('Statistics retrieved', stats);
  }

  /**
   * Get users by role (Admin only)
   */
  @Get('role/:role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get users by role' })
  @ApiParam({ name: 'role', enum: UserRole })
  @ApiSwaggerResponse({ status: 200, description: 'Users retrieved' })
  async findByRole(@Param('role') role: UserRole, @Query() paginationDto: PaginationDto) {
    const result = await this.userService.findByRole(role, paginationDto);
    return ApiResponse.success('Users retrieved successfully', result);
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiSwaggerResponse({ status: 200, description: 'User found' })
  @ApiSwaggerResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return ApiResponse.success('User found', user);
  }

  /**
   * Update current user profile
   */
  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiSwaggerResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(@CurrentUser('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.updateProfile(userId, updateUserDto);
    return ApiResponse.success('Profile updated successfully', user);
  }

  /**
   * Change current user password
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiSwaggerResponse({ status: 200, description: 'Password changed' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(userId, changePasswordDto);
    return ApiResponse.success('Password changed successfully');
  }

  /**
   * Update user role (Admin only)
   */
  @Put(':id/role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiSwaggerResponse({ status: 200, description: 'Role updated' })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateUserRoleDto) {
    const user = await this.userService.updateRole(id, updateRoleDto);
    return ApiResponse.success('User role updated', user);
  }

  /**
   * Update user status (Admin only)
   */
  @Put(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiSwaggerResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateUserStatusDto) {
    const user = await this.userService.updateStatus(id, updateStatusDto);
    return ApiResponse.success('User status updated', user);
  }

  /**
   * Delete user (Admin only)
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)' })
  @ApiSwaggerResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return ApiResponse.success('User deleted successfully');
  }
}
