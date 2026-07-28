import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(query: {
    status?: string;
    category?: string;
    carId?: string;
    q?: string;
  }) {
    return this.db.listParts(query);
  }

  async findOne(id: string) {
    const part = await this.db.getPart(id);
    if (!part) throw new NotFoundException(`Part ${id} not found`);
    return part;
  }

  create(dto: CreatePartDto) {
    return this.db.createPart(dto);
  }

  async update(id: string, dto: UpdatePartDto) {
    const part = await this.db.updatePart(id, dto);
    if (!part) throw new NotFoundException(`Part ${id} not found`);
    return part;
  }

  async remove(id: string) {
    const ok = await this.db.deletePart(id);
    if (!ok) throw new NotFoundException(`Part ${id} not found`);
    return { deleted: true };
  }
}
