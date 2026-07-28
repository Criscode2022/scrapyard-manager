import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(status?: string, q?: string) {
    return this.db.listCars(status, q);
  }

  async findOne(id: string) {
    const car = await this.db.getCar(id);
    if (!car) throw new NotFoundException(`Car ${id} not found`);
    return car;
  }

  create(dto: CreateCarDto) {
    return this.db.createCar(dto);
  }

  async update(id: string, dto: UpdateCarDto) {
    const car = await this.db.updateCar(id, dto);
    if (!car) throw new NotFoundException(`Car ${id} not found`);
    return car;
  }

  async remove(id: string) {
    const ok = await this.db.deleteCar(id);
    if (!ok) throw new NotFoundException(`Car ${id} not found`);
    return { deleted: true };
  }
}
