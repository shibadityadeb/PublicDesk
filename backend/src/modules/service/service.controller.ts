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
import { ServiceCatalogService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { UserRole } from '@common/enums';
import { ApiResponse, PaginationDto } from '@common/dto';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServiceController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new service' })
  async create(@Body() dto: CreateServiceDto) {
    const result = await this.serviceCatalogService.create(dto);
    return ApiResponse.success('Service created successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with pagination' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.serviceCatalogService.findAll(pagination);
    return ApiResponse.success('Services retrieved successfully', result);
  }

  @Get('office/:officeId')
  @ApiOperation({ summary: 'Get services for a specific office' })
  async findByOffice(@Param('officeId') officeId: string, @Query() pagination: PaginationDto) {
    const result = await this.serviceCatalogService.findByOffice(officeId, pagination);
    return ApiResponse.success('Services retrieved successfully', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.serviceCatalogService.findById(id);
    return ApiResponse.success('Service retrieved successfully', result);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get service statistics' })
  async getStats(@Param('id') id: string) {
    const result = await this.serviceCatalogService.getServiceStats(id);
    return ApiResponse.success('Service statistics retrieved', result);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update service' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const result = await this.serviceCatalogService.update(id, dto);
    return ApiResponse.success('Service updated successfully', result);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete service' })
  async remove(@Param('id') id: string) {
    await this.serviceCatalogService.remove(id);
    return ApiResponse.success('Service deleted successfully');
  }
}
