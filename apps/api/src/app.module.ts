import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CarsModule } from './cars/cars.module';
import { PartsModule } from './parts/parts.module';
import { StatsModule } from './stats/stats.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot(),
    CarsModule,
    PartsModule,
    StatsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
