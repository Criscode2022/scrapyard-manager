import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('carId') carId?: string,
    @Query('q') q?: string,
  ) {
    return this.partsService.findAll({ status, category, carId, q });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePartDto) {
    return this.partsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartDto) {
    return this.partsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }
}
