import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Part } from '../parts/part.entity';

export enum CarStatus {
  ARRIVED = 'arrived',
  DISMANTLING = 'dismantling',
  COMPLETE = 'complete',
  CRUSHED = 'crushed',
  SOLD = 'sold',
}

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  make!: string;

  @Column({ type: 'varchar', length: 80 })
  model!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  vin!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', length: 20, default: CarStatus.ARRIVED })
  status!: CarStatus;

  @Column({ type: 'varchar', length: 80, nullable: true })
  yardLocation!: string | null;

  @Column({ type: 'date', nullable: true })
  arrivalDate!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  purchasePrice!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'int', default: 0 })
  odometer!: number;

  @OneToMany(() => Part, (part) => part.car)
  parts!: Part[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
