import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { ServiceStatus } from '@common/enums';

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    const count = await this.serviceRepository.count();
    const code = `SVC-${String(count + 1).padStart(3, '0')}`;

    const service = this.serviceRepository.create({ ...dto, code });
    await this.serviceRepository.save(service);
    this.logger.log(`Service created: ${service.code}`, 'ServiceCatalogService');
    return service;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Service>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.serviceRepository.findAndCount({
      skip,
      take: limit,
      relations: ['office'],
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findByOffice(officeId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Service>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.serviceRepository.findAndCount({
      where: { officeId, status: ServiceStatus.ACTIVE },
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['office'],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);
    Object.assign(service, dto);
    await this.serviceRepository.save(service);
    this.logger.log(`Service updated: ${id}`, 'ServiceCatalogService');
    return service;
  }

  async remove(id: string): Promise<void> {
    const service = await this.findById(id);
    await this.serviceRepository.softRemove(service);
    this.logger.log(`Service deleted: ${id}`, 'ServiceCatalogService');
  }

  async getServiceStats(id: string): Promise<any> {
    await this.findById(id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      serviceId: id,
      message: 'Stats will include appointment and token counts once those modules are active',
    };
  }
}
