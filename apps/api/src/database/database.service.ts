import { Injectable, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Car, CarStatus } from '../cars/car.entity';
import { Part, PartCategory, PartStatus } from '../parts/part.entity';
import { memoryStore } from './memory.store';
import { CreateCarDto } from '../cars/dto/create-car.dto';
import { UpdateCarDto } from '../cars/dto/update-car.dto';
import { CreatePartDto } from '../parts/dto/create-part.dto';
import { UpdatePartDto } from '../parts/dto/update-part.dto';

export type DbMode = 'neon' | 'memory';

@Injectable()
export class DatabaseService implements OnModuleInit {
  readonly mode: DbMode;

  constructor(
    private readonly carRepo?: Repository<Car>,
    private readonly partRepo?: Repository<Part>,
  ) {
    this.mode = this.carRepo && this.partRepo ? 'neon' : 'memory';
  }

  onModuleInit() {
    // eslint-disable-next-line no-console
    console.log(
      this.mode === 'neon'
        ? 'Database: Neon Postgres (DATABASE_URL)'
        : 'Database: in-memory store (set DATABASE_URL for Neon)',
    );
  }

  async listCars(status?: string, q?: string) {
    if (this.mode === 'memory') return memoryStore.listCars(status, q);
    const qb = this.carRepo!.createQueryBuilder('car').leftJoinAndSelect(
      'car.parts',
      'parts',
    );
    if (status) qb.andWhere('car.status = :status', { status });
    if (q) {
      qb.andWhere(
        '(LOWER(car.make) LIKE :q OR LOWER(car.model) LIKE :q OR LOWER(car.vin) LIKE :q OR LOWER(car.yardLocation) LIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }
    return qb.orderBy('car.createdAt', 'DESC').getMany();
  }

  async getCar(id: string) {
    if (this.mode === 'memory') return memoryStore.getCar(id);
    return this.carRepo!.findOne({ where: { id }, relations: ['parts'] });
  }

  async createCar(dto: CreateCarDto) {
    if (this.mode === 'memory') return memoryStore.createCar(dto);
    const car = this.carRepo!.create({
      ...dto,
      purchasePrice: dto.purchasePrice ?? 0,
      odometer: dto.odometer ?? 0,
      arrivalDate: dto.arrivalDate ?? new Date().toISOString().slice(0, 10),
    });
    return this.carRepo!.save(car);
  }

  async updateCar(id: string, dto: UpdateCarDto) {
    if (this.mode === 'memory') return memoryStore.updateCar(id, dto);
    const car = await this.carRepo!.findOne({ where: { id } });
    if (!car) return null;
    Object.assign(car, dto);
    await this.carRepo!.save(car);
    return this.getCar(id);
  }

  async deleteCar(id: string) {
    if (this.mode === 'memory') return memoryStore.deleteCar(id);
    const result = await this.carRepo!.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async listParts(filters: {
    status?: string;
    category?: string;
    carId?: string;
    q?: string;
  }) {
    if (this.mode === 'memory') return memoryStore.listParts(filters);
    const qb = this.partRepo!.createQueryBuilder('part').leftJoinAndSelect(
      'part.car',
      'car',
    );
    if (filters.status)
      qb.andWhere('part.status = :status', { status: filters.status });
    if (filters.category)
      qb.andWhere('part.category = :category', { category: filters.category });
    if (filters.carId)
      qb.andWhere('part.carId = :carId', { carId: filters.carId });
    if (filters.q) {
      qb.andWhere(
        '(LOWER(part.name) LIKE :q OR LOWER(part.sku) LIKE :q OR LOWER(part.binLocation) LIKE :q)',
        { q: `%${filters.q.toLowerCase()}%` },
      );
    }
    return qb.orderBy('part.createdAt', 'DESC').getMany();
  }

  async getPart(id: string) {
    if (this.mode === 'memory') return memoryStore.getPart(id);
    return this.partRepo!.findOne({ where: { id }, relations: ['car'] });
  }

  async createPart(dto: CreatePartDto) {
    if (this.mode === 'memory') return memoryStore.createPart(dto);
    const part = this.partRepo!.create({
      ...dto,
      price: dto.price ?? 0,
      quantity: dto.quantity ?? 1,
    });
    return this.partRepo!.save(part);
  }

  async updatePart(id: string, dto: UpdatePartDto) {
    if (this.mode === 'memory') return memoryStore.updatePart(id, dto);
    const part = await this.partRepo!.findOne({ where: { id } });
    if (!part) return null;
    Object.assign(part, dto);
    await this.partRepo!.save(part);
    return this.getPart(id);
  }

  async deletePart(id: string) {
    if (this.mode === 'memory') return memoryStore.deletePart(id);
    const result = await this.partRepo!.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async stats() {
    if (this.mode === 'memory') return memoryStore.stats();

    const cars = await this.carRepo!.find();
    const parts = await this.partRepo!.find({ relations: ['car'] });
    const available = parts.filter((p) => p.status === PartStatus.AVAILABLE);
    const reserved = parts.filter((p) => p.status === PartStatus.RESERVED);
    const sold = parts.filter((p) => p.status === PartStatus.SOLD);
    const inventoryValue = available.reduce(
      (sum, p) => sum + Number(p.price) * Number(p.quantity),
      0,
    );

    const carsByStatus = Object.values(CarStatus).map((status) => ({
      status,
      count: cars.filter((c) => c.status === status).length,
    }));
    const partsByCategory = Object.values(PartCategory).map((category) => ({
      category,
      count: parts.filter((p) => p.category === category).length,
    }));

    const recentCars = await this.carRepo!.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['parts'],
    });
    const recentParts = await this.partRepo!.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['car'],
    });

    return {
      totalCars: cars.length,
      totalParts: parts.length,
      availableParts: available.length,
      reservedParts: reserved.length,
      soldParts: sold.length,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      carsByStatus,
      partsByCategory,
      recentCars,
      recentParts,
      dbSource: 'neon' as const,
    };
  }
}
