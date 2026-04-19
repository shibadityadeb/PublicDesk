import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TokenService } from './token.service';
import { GenerateTokenDto, CallNextDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';
import { UserRole, TokenStatus } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Tokens')
@Controller('tokens')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a digital token' })
  async generate(@CurrentUser() user: User, @Body() dto: GenerateTokenDto) {
    const result = await this.tokenService.generateToken(user.id, dto);
    return ApiResponse.success('Token generated successfully', result);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user tokens' })
  async findMy(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    const result = await this.tokenService.findByCitizen(user.id, pagination);
    return ApiResponse.success('Tokens retrieved successfully', result);
  }

  @Get('queue/:officeId')
  @ApiOperation({ summary: 'Get active queue for an office' })
  @ApiQuery({ name: 'serviceId', required: false })
  async getActiveQueue(
    @Param('officeId') officeId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const result = await this.tokenService.getActiveQueue(officeId, serviceId);
    return ApiResponse.success('Active queue retrieved', result);
  }

  @Get('status/:officeId')
  @ApiOperation({ summary: 'Get queue status metrics for an office' })
  @ApiQuery({ name: 'serviceId', required: false })
  async getQueueStatus(
    @Param('officeId') officeId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const result = await this.tokenService.getQueueStatus(officeId, serviceId);
    return ApiResponse.success('Queue status retrieved', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get token by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.tokenService.findById(id);
    return ApiResponse.success('Token retrieved successfully', result);
  }

  @Get(':id/position')
  @ApiOperation({ summary: 'Get current queue position for a token' })
  async getPosition(@Param('id') id: string) {
    const result = await this.tokenService.getQueuePosition(id);
    return ApiResponse.success('Queue position retrieved', result);
  }

  @Patch('call-next/:officeId')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Call next token in queue' })
  async callNext(@Param('officeId') officeId: string, @Body() dto: CallNextDto) {
    const result = await this.tokenService.callNext(officeId, dto);
    if (!result) return ApiResponse.success('No tokens waiting in queue', null);
    return ApiResponse.success('Next token called', result);
  }

  @Patch(':id/start-service')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start service for a called token' })
  async startService(
    @Param('id') id: string,
    @Body() body: { counterId: string; counterNumber: number },
  ) {
    const result = await this.tokenService.startService(id, body.counterId, body.counterNumber);
    return ApiResponse.success('Service started', result);
  }

  @Patch(':id/complete')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete service for a token' })
  async complete(@Param('id') id: string) {
    const result = await this.tokenService.completeToken(id);
    return ApiResponse.success('Token completed', result);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a token' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { reason?: string },
  ) {
    const result = await this.tokenService.cancelToken(id, user, body.reason);
    return ApiResponse.success('Token cancelled', result);
  }

  @Patch(':id/no-show')
  @Roles(UserRole.OFFICER, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark token as no-show' })
  async noShow(@Param('id') id: string) {
    const result = await this.tokenService.noShow(id);
    return ApiResponse.success('Token marked as no-show', result);
  }
}
