import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Office } from './entities/office.entity';
import { Counter } from './entities/counter.entity';
import { CreateOfficeDto, UpdateOfficeDto, CreateCounterDto, UpdateCounterDto } from './dto';
import { AppLoggerService } from '@common/logger/logger.service';
import { PaginationDto, PaginatedResponse } from '@common/dto';
import { CounterStatus, OfficeStatus } from '@common/enums';

@Injectable()
export class OfficeService implements OnModuleInit {
  constructor(
    @InjectRepository(Office)
    private readonly officeRepository: Repository<Office>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.seedMockOffices();
  }

  private async seedMockOffices(): Promise<void> {
    const count = await this.officeRepository.count();
    if (count > 0) return;

    const offices: Partial<Office>[] = [
      {
        name: 'Central Citizen Services',
        code: 'OFF-001',
        description: 'Main public service center for city-wide services',
        address: '12 Main Road, Civic Center',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+91 8022334455',
        email: 'central@publicdesk.local',
        status: OfficeStatus.ACTIVE,
        openingTime: '09:00',
        closingTime: '17:00',
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        maxCapacity: 600,
        currentCapacity: 0,
      },
      {
        name: 'North Zone Office',
        code: 'OFF-002',
        description: 'Regional office for north zone citizens',
        address: '45 Lake View Street, North Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560042',
        phone: '+91 8045567788',
        email: 'north@publicdesk.local',
        status: OfficeStatus.ACTIVE,
        openingTime: '09:30',
        closingTime: '17:30',
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        maxCapacity: 400,
        currentCapacity: 0,
      },
      {
        name: 'South Zone Office',
        code: 'OFF-003',
        description: 'Regional office for south zone citizens',
        address: '88 Market Avenue, South Circle',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560068',
        phone: '+91 8099988877',
        email: 'south@publicdesk.local',
        status: OfficeStatus.ACTIVE,
        openingTime: '10:00',
        closingTime: '18:00',
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        maxCapacity: 350,
        currentCapacity: 0,
      },
    ];

    await this.officeRepository.save(offices);
    this.logger.log('Seeded mock offices', 'OfficeService');
  }

  async create(dto: CreateOfficeDto): Promise<Office> {
    const count = await this.officeRepository.count();
    const code = `OFF-${String(count + 1).padStart(3, '0')}`;

    const existing = await this.officeRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Office code ${code} already in use`);
    }

    const office = this.officeRepository.create({ ...dto, code });
    await this.officeRepository.save(office);
    this.logger.log(`Office created: ${office.code}`, 'OfficeService');
    return office;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<Office>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.officeRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<Office> {
    const office = await this.officeRepository.findOne({ where: { id } });
    if (!office) throw new NotFoundException('Office not found');
    return office;
  }

  async findByCity(city: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Office>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.officeRepository.findAndCount({
      where: { city },
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, dto: UpdateOfficeDto): Promise<Office> {
    const office = await this.findById(id);
    Object.assign(office, dto);
    await this.officeRepository.save(office);
    this.logger.log(`Office updated: ${id}`, 'OfficeService');
    return office;
  }

  async remove(id: string): Promise<void> {
    const office = await this.findById(id);
    await this.officeRepository.softRemove(office);
    this.logger.log(`Office deleted: ${id}`, 'OfficeService');
  }

  async getStats(id: string): Promise<any> {
    await this.findById(id);

    const counters = await this.counterRepository.count({ where: { officeId: id } });
    const availableCounters = await this.counterRepository.count({
      where: { officeId: id, status: CounterStatus.AVAILABLE },
    });
    const busyCounters = await this.counterRepository.count({
      where: { officeId: id, status: CounterStatus.BUSY },
    });

    return { counters, availableCounters, busyCounters };
  }

  async createCounter(officeId: string, dto: CreateCounterDto): Promise<Counter> {
    await this.findById(officeId);

    const existing = await this.counterRepository.findOne({
      where: { officeId, number: dto.number },
    });
    if (existing) throw new ConflictException(`Counter number ${dto.number} already exists in this office`);

    const counter = this.counterRepository.create({ ...dto, officeId });
    await this.counterRepository.save(counter);
    this.logger.log(`Counter ${dto.number} created for office ${officeId}`, 'OfficeService');
    return counter;
  }

  async findCountersByOffice(officeId: string): Promise<Counter[]> {
    await this.findById(officeId);
    return this.counterRepository.find({
      where: { officeId },
      order: { number: 'ASC' },
    });
  }

  async updateCounter(counterId: string, dto: UpdateCounterDto): Promise<Counter> {
    const counter = await this.counterRepository.findOne({ where: { id: counterId } });
    if (!counter) throw new NotFoundException('Counter not found');
    Object.assign(counter, dto);
    await this.counterRepository.save(counter);
    return counter;
  }

  async assignOfficer(counterId: string, officerId: string): Promise<Counter> {
    const counter = await this.counterRepository.findOne({ where: { id: counterId } });
    if (!counter) throw new NotFoundException('Counter not found');
    counter.currentOfficerId = officerId;
    counter.status = CounterStatus.AVAILABLE;
    await this.counterRepository.save(counter);
    this.logger.log(`Officer ${officerId} assigned to counter ${counterId}`, 'OfficeService');
    return counter;
  }
}
