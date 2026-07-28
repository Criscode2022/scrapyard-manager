import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CarStatus } from '../cars/car.entity';
import {
  PartCategory,
  PartCondition,
  PartStatus,
} from '../parts/part.entity';

/** Seeds demo data into Neon when the tables are empty. */
@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    if (this.db.mode !== 'neon') return;
    const cars = await this.db.listCars();
    if (cars.length > 0) return;

    // eslint-disable-next-line no-console
    console.log('Seeding Neon database with demo scrapyard data…');

    const camry = await this.db.createCar({
      make: 'Toyota',
      model: 'Camry',
      year: 2014,
      vin: '4T1BF1FK5EU123456',
      color: 'Silver',
      status: CarStatus.DISMANTLING,
      yardLocation: 'Row A-12',
      arrivalDate: '2026-06-12',
      purchasePrice: 850,
      odometer: 142000,
      notes: 'Front collision. Engine runs, transmission good.',
    });
    const f150 = await this.db.createCar({
      make: 'Ford',
      model: 'F-150',
      year: 2011,
      vin: '1FTFW1EF1BFC98765',
      color: 'Black',
      status: CarStatus.ARRIVED,
      yardLocation: 'Row B-03',
      arrivalDate: '2026-07-20',
      purchasePrice: 1200,
      odometer: 189500,
      notes: 'Bed rust. 5.0 V8 intact.',
    });
    await this.db.createCar({
      make: 'Honda',
      model: 'Civic',
      year: 2016,
      vin: '2HGFC2F59GH445566',
      color: 'Blue',
      status: CarStatus.COMPLETE,
      yardLocation: 'Row C-07',
      arrivalDate: '2026-05-02',
      purchasePrice: 600,
      odometer: 98000,
      notes: 'Fully stripped. Shell ready for crusher.',
    });
    const bmw = await this.db.createCar({
      make: 'BMW',
      model: '320i',
      year: 2013,
      vin: 'WBA3A5C50DF345678',
      color: 'White',
      status: CarStatus.DISMANTLING,
      yardLocation: 'Row A-04',
      arrivalDate: '2026-07-01',
      purchasePrice: 1400,
      odometer: 121200,
      notes: 'European parts demand high.',
    });

    await this.db.createPart({
      name: '2.5L 4-Cyl Engine',
      category: PartCategory.ENGINE,
      condition: PartCondition.USED_GOOD,
      status: PartStatus.AVAILABLE,
      price: 1200,
      quantity: 1,
      binLocation: 'Eng-Bay-2',
      carId: camry.id,
      sku: 'ENG-CAM-14-25',
    });
    await this.db.createPart({
      name: 'Automatic Transmission',
      category: PartCategory.TRANSMISSION,
      condition: PartCondition.USED_EXCELLENT,
      status: PartStatus.AVAILABLE,
      price: 650,
      quantity: 1,
      binLocation: 'Trans-01',
      carId: camry.id,
      sku: 'TRN-CAM-14-AT',
    });
    await this.db.createPart({
      name: '5.0L V8 Engine',
      category: PartCategory.ENGINE,
      condition: PartCondition.USED_EXCELLENT,
      status: PartStatus.RESERVED,
      price: 2200,
      quantity: 1,
      binLocation: 'Eng-Bay-1',
      carId: f150.id,
      sku: 'ENG-F15-11-50',
    });
    await this.db.createPart({
      name: 'Alloy Wheel Set (4)',
      category: PartCategory.WHEELS,
      condition: PartCondition.USED_GOOD,
      status: PartStatus.AVAILABLE,
      price: 320,
      quantity: 4,
      binLocation: 'Whl-03',
      carId: f150.id,
      sku: 'WHL-F15-11-AL',
    });
    await this.db.createPart({
      name: 'N20 Turbo Engine',
      category: PartCategory.ENGINE,
      condition: PartCondition.USED_GOOD,
      status: PartStatus.AVAILABLE,
      price: 1850,
      quantity: 1,
      binLocation: 'Eng-Bay-3',
      carId: bmw.id,
      sku: 'ENG-BMW-13-N20',
    });
    await this.db.createPart({
      name: 'Leather Seat Set',
      category: PartCategory.INTERIOR,
      condition: PartCondition.USED_EXCELLENT,
      status: PartStatus.AVAILABLE,
      price: 480,
      quantity: 1,
      binLocation: 'Int-08',
      carId: bmw.id,
      sku: 'INT-BMW-13-STS',
    });
    await this.db.createPart({
      name: 'Catalytic Converter',
      category: PartCategory.OTHER,
      condition: PartCondition.USED_GOOD,
      status: PartStatus.AVAILABLE,
      price: 350,
      quantity: 3,
      binLocation: 'Cat-Safe',
      sku: 'OTH-CAT-GEN-01',
    });
  }
}
