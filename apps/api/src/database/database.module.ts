import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from '../cars/car.entity';
import { Part } from '../parts/part.entity';
import { DatabaseService } from './database.service';
import { SeedService } from './seed.service';

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  return raw && raw.trim() ? raw.trim() : undefined;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const url = databaseUrl();

    if (!url) {
      return {
        module: DatabaseModule,
        providers: [
          {
            provide: DatabaseService,
            useFactory: () => new DatabaseService(undefined, undefined),
          },
          SeedService,
        ],
        exports: [DatabaseService],
      };
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url,
          ssl: { rejectUnauthorized: false },
          entities: [Car, Part],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Car, Part]),
      ],
      providers: [
        {
          provide: DatabaseService,
          useFactory: (carRepo: Repository<Car>, partRepo: Repository<Part>) =>
            new DatabaseService(carRepo, partRepo),
          inject: [getRepositoryToken(Car), getRepositoryToken(Part)],
        },
        SeedService,
      ],
      exports: [DatabaseService, TypeOrmModule],
    };
  }
}
