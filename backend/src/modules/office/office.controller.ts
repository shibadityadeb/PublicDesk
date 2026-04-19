import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { OfficeService } from './office.service';
import { CreateOfficeDto, UpdateOfficeDto, CreateCounterDto, UpdateCounterDto, AssignOfficerDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';

@ApiTags('Offices')
@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new office' })
  @ApiSwaggerResponse({ status: 201, description: 'Office created successfully' })
  async create(@Body() dto: CreateOfficeDto) {
    const result = await this.officeService.create(dto);
    return ApiResponse.success('Office created successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offices with pagination' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.officeService.findAll(pagination);
    return ApiResponse.success('Offices retrieved successfully', result);
  }

  @Get('city/:city')
  @ApiOperation({ summary: 'Get offices by city' })
  async findByCity(@Param('city') city: string, @Query() pagination: PaginationDto) {
    const result = await this.officeService.findByCity(city, pagination);
    return ApiResponse.success('Offices retrieved successfully', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get office by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.officeService.findById(id);
    return ApiResponse.success('Office retrieved successfully', result);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get office statistics' })
  async getStats(@Param('id') id: string) {
    const result = await this.officeService.getStats(id);
    return ApiResponse.success('Office statistics retrieved', result);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update office' })
  async update(@Param('id') id: string, @Body() dto: UpdateOfficeDto) {
    const result = await this.officeService.update(id, dto);
    return ApiResponse.success('Office updated successfully', result);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete office (soft delete)' })
  async remove(@Param('id') id: string) {
    await this.officeService.remove(id);
    return ApiResponse.success('Office deleted successfully');
  }

  @Post(':id/counters')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create counter for office' })
  async createCounter(@Param('id') officeId: string, @Body() dto: CreateCounterDto) {
    const result = await this.officeService.createCounter(officeId, dto);
    return ApiResponse.success('Counter created successfully', result);
  }

  @Get(':id/counters')
  @ApiOperation({ summary: 'Get all counters for an office' })
  async getCounters(@Param('id') officeId: string) {
    const result = await this.officeService.findCountersByOffice(officeId);
    return ApiResponse.success('Counters retrieved successfully', result);
  }

  @Patch(':officeId/counters/:counterId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update counter status or details' })
  async updateCounter(
    @Param('counterId') counterId: string,
    @Body() dto: UpdateCounterDto,
  ) {
    const result = await this.officeService.updateCounter(counterId, dto);
    return ApiResponse.success('Counter updated successfully', result);
  }

  @Patch(':officeId/counters/:counterId/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign officer to counter' })
  async assignOfficer(
    @Param('counterId') counterId: string,
    @Body() dto: AssignOfficerDto,
  ) {
    const result = await this.officeService.assignOfficer(counterId, dto.officerId);
    return ApiResponse.success('Officer assigned to counter', result);
  }
}
