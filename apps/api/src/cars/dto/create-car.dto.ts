import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CarStatus } from '../car.entity';

export class CreateCarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  make!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model!: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  yardLocation?: string;

  @IsOptional()
  @IsString()
  arrivalDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;
}
