import { randomUUID } from 'crypto';
import { Car, CarStatus } from '../cars/car.entity';
import { Part, PartCategory, PartCondition, PartStatus } from '../parts/part.entity';
import { CreateCarDto } from '../cars/dto/create-car.dto';
import { UpdateCarDto } from '../cars/dto/update-car.dto';
import { CreatePartDto } from '../parts/dto/create-part.dto';
import { UpdatePartDto } from '../parts/dto/update-part.dto';

/** In-memory dual-mode store used when DATABASE_URL (Neon) is not configured. */
export class MemoryStore {
  private cars = new Map<string, Car>();
  private parts = new Map<string, Part>();

  constructor() {
    this.seed();
  }

  private seed() {
    const samples: CreateCarDto[] = [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
    ];

    const carIds: string[] = [];
    for (const s of samples) {
      const car = this.createCar(s);
      carIds.push(car.id);
    }

    const partSeeds: CreatePartDto[] = [
      {
        name: '2.5L 4-Cyl Engine',
        category: PartCategory.ENGINE,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.AVAILABLE,
        price: 1200,
        quantity: 1,
        binLocation: 'Eng-Bay-2',
        carId: carIds[0],
        sku: 'ENG-CAM-14-25',
      },
      {
        name: 'Automatic Transmission',
        category: PartCategory.TRANSMISSION,
        condition: PartCondition.USED_EXCELLENT,
        status: PartStatus.AVAILABLE,
        price: 650,
        quantity: 1,
        binLocation: 'Trans-01',
        carId: carIds[0],
        sku: 'TRN-CAM-14-AT',
      },
      {
        name: 'Driver Door Assembly',
        category: PartCategory.BODY,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.AVAILABLE,
        price: 180,
        quantity: 1,
        binLocation: 'Body-A',
        carId: carIds[0],
        sku: 'BDY-CAM-14-DDR',
      },
      {
        name: '5.0L V8 Engine',
        category: PartCategory.ENGINE,
        condition: PartCondition.USED_EXCELLENT,
        status: PartStatus.RESERVED,
        price: 2200,
        quantity: 1,
        binLocation: 'Eng-Bay-1',
        carId: carIds[1],
        sku: 'ENG-F15-11-50',
      },
      {
        name: 'Alloy Wheel Set (4)',
        category: PartCategory.WHEELS,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.AVAILABLE,
        price: 320,
        quantity: 4,
        binLocation: 'Whl-03',
        carId: carIds[1],
        sku: 'WHL-F15-11-AL',
      },
      {
        name: 'Headlight Pair',
        category: PartCategory.ELECTRICAL,
        condition: PartCondition.USED_FAIR,
        status: PartStatus.AVAILABLE,
        price: 95,
        quantity: 2,
        binLocation: 'Elec-12',
        carId: carIds[2],
        sku: 'ELC-CIV-16-HL',
      },
      {
        name: 'Front Bumper Cover',
        category: PartCategory.BODY,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.SOLD,
        price: 210,
        quantity: 0,
        binLocation: 'Body-B',
        carId: carIds[2],
        sku: 'BDY-CIV-16-FB',
      },
      {
        name: 'N20 Turbo Engine',
        category: PartCategory.ENGINE,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.AVAILABLE,
        price: 1850,
        quantity: 1,
        binLocation: 'Eng-Bay-3',
        carId: carIds[3],
        sku: 'ENG-BMW-13-N20',
      },
      {
        name: 'Leather Seat Set',
        category: PartCategory.INTERIOR,
        condition: PartCondition.USED_EXCELLENT,
        status: PartStatus.AVAILABLE,
        price: 480,
        quantity: 1,
        binLocation: 'Int-08',
        carId: carIds[3],
        sku: 'INT-BMW-13-STS',
      },
      {
        name: 'Catalytic Converter',
        category: PartCategory.OTHER,
        condition: PartCondition.USED_GOOD,
        status: PartStatus.AVAILABLE,
        price: 350,
        quantity: 3,
        binLocation: 'Cat-Safe',
        sku: 'OTH-CAT-GEN-01',
      },
    ];

    for (const p of partSeeds) {
      this.createPart(p);
    }
  }

  listCars(status?: string, q?: string): Car[] {
    let rows = [...this.cars.values()];
    if (status) rows = rows.filter((c) => c.status === status);
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.make.toLowerCase().includes(needle) ||
          c.model.toLowerCase().includes(needle) ||
          (c.vin ?? '').toLowerCase().includes(needle) ||
          (c.yardLocation ?? '').toLowerCase().includes(needle),
      );
    }
    return rows
      .map((c) => this.withParts(c))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  getCar(id: string): Car | null {
    const car = this.cars.get(id);
    return car ? this.withParts(car) : null;
  }

  createCar(dto: CreateCarDto): Car {
    const now = new Date();
    const car: Car = {
      id: randomUUID(),
      make: dto.make,
      model: dto.model,
      year: dto.year,
      vin: dto.vin ?? null,
      color: dto.color ?? null,
      status: dto.status ?? CarStatus.ARRIVED,
      yardLocation: dto.yardLocation ?? null,
      arrivalDate: dto.arrivalDate ?? now.toISOString().slice(0, 10),
      purchasePrice: Number(dto.purchasePrice ?? 0),
      notes: dto.notes ?? null,
      odometer: dto.odometer ?? 0,
      parts: [],
      createdAt: now,
      updatedAt: now,
    };
    this.cars.set(car.id, car);
    return this.withParts(car);
  }

  updateCar(id: string, dto: UpdateCarDto): Car | null {
    const car = this.cars.get(id);
    if (!car) return null;
    Object.assign(car, {
      ...dto,
      purchasePrice:
        dto.purchasePrice !== undefined
          ? Number(dto.purchasePrice)
          : car.purchasePrice,
      updatedAt: new Date(),
    });
    this.cars.set(id, car);
    return this.withParts(car);
  }

  deleteCar(id: string): boolean {
    if (!this.cars.has(id)) return false;
    for (const part of this.parts.values()) {
      if (part.carId === id) {
        part.carId = null;
        part.car = null;
        part.updatedAt = new Date();
      }
    }
    return this.cars.delete(id);
  }

  listParts(filters: {
    status?: string;
    category?: string;
    carId?: string;
    q?: string;
  }): Part[] {
    let rows = [...this.parts.values()];
    if (filters.status) rows = rows.filter((p) => p.status === filters.status);
    if (filters.category)
      rows = rows.filter((p) => p.category === filters.category);
    if (filters.carId) rows = rows.filter((p) => p.carId === filters.carId);
    if (filters.q) {
      const needle = filters.q.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.sku ?? '').toLowerCase().includes(needle) ||
          (p.binLocation ?? '').toLowerCase().includes(needle),
      );
    }
    return rows
      .map((p) => this.withCar(p))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  getPart(id: string): Part | null {
    const part = this.parts.get(id);
    return part ? this.withCar(part) : null;
  }

  createPart(dto: CreatePartDto): Part {
    const now = new Date();
    const part: Part = {
      id: randomUUID(),
      name: dto.name,
      category: dto.category ?? PartCategory.OTHER,
      sku: dto.sku ?? null,
      condition: dto.condition ?? PartCondition.USED_GOOD,
      status: dto.status ?? PartStatus.AVAILABLE,
      price: Number(dto.price ?? 0),
      quantity: dto.quantity ?? 1,
      binLocation: dto.binLocation ?? null,
      notes: dto.notes ?? null,
      carId: dto.carId ?? null,
      car: null,
      createdAt: now,
      updatedAt: now,
    };
    this.parts.set(part.id, part);
    return this.withCar(part);
  }

  updatePart(id: string, dto: UpdatePartDto): Part | null {
    const part = this.parts.get(id);
    if (!part) return null;
    Object.assign(part, {
      ...dto,
      price: dto.price !== undefined ? Number(dto.price) : part.price,
      updatedAt: new Date(),
    });
    this.parts.set(id, part);
    return this.withCar(part);
  }

  deletePart(id: string): boolean {
    return this.parts.delete(id);
  }

  stats() {
    const cars = [...this.cars.values()];
    const parts = [...this.parts.values()];
    const available = parts.filter((p) => p.status === PartStatus.AVAILABLE);
    const reserved = parts.filter((p) => p.status === PartStatus.RESERVED);
    const sold = parts.filter((p) => p.status === PartStatus.SOLD);
    const inventoryValue = available.reduce(
      (sum, p) => sum + Number(p.price) * Number(p.quantity),
      0,
    );
    const carsByStatus = Object.values(CarStatus).map((status) => ({
      status,
      count: cars.filter((c) => c.status === status).length,
    }));
    const partsByCategory = Object.values(PartCategory).map((category) => ({
      category,
      count: parts.filter((p) => p.category === category).length,
    }));

    return {
      totalCars: cars.length,
      totalParts: parts.length,
      availableParts: available.length,
      reservedParts: reserved.length,
      soldParts: sold.length,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      carsByStatus,
      partsByCategory,
      recentCars: cars
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 5)
        .map((c) => this.withParts(c)),
      recentParts: parts
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 5)
        .map((p) => this.withCar(p)),
      dbSource: 'memory' as const,
    };
  }

  private withParts(car: Car): Car {
    const parts = [...this.parts.values()].filter((p) => p.carId === car.id);
    return { ...car, parts: parts.map((p) => ({ ...p, car: null })) };
  }

  private withCar(part: Part): Part {
    const car = part.carId ? this.cars.get(part.carId) : null;
    return {
      ...part,
      car: car
        ? {
            ...car,
            parts: [],
          }
        : null,
    };
  }
}

export const memoryStore = new MemoryStore();
