import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PartCategory, PartCondition, PartStatus } from '../part.entity';

export class CreatePartDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEnum(PartCategory)
  category?: PartCategory;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sku?: string;

  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;

  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  binLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  carId?: string;
}
