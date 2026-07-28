import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Car } from '../cars/car.entity';

export enum PartCondition {
  NEW = 'new',
  USED_EXCELLENT = 'used_excellent',
  USED_GOOD = 'used_good',
  USED_FAIR = 'used_fair',
  SALVAGE = 'salvage',
}

export enum PartStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  SCRAPPED = 'scrapped',
}

export enum PartCategory {
  ENGINE = 'engine',
  TRANSMISSION = 'transmission',
  BODY = 'body',
  INTERIOR = 'interior',
  ELECTRICAL = 'electrical',
  SUSPENSION = 'suspension',
  BRAKES = 'brakes',
  WHEELS = 'wheels',
  GLASS = 'glass',
  OTHER = 'other',
}

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 40, default: PartCategory.OTHER })
  category!: PartCategory;

  @Column({ type: 'varchar', length: 40, nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar', length: 24, default: PartCondition.USED_GOOD })
  condition!: PartCondition;

  @Column({ type: 'varchar', length: 20, default: PartStatus.AVAILABLE })
  status!: PartStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  binLocation!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', nullable: true })
  carId!: string | null;

  @ManyToOne(() => Car, (car) => car.parts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'carId' })
  car!: Car | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
