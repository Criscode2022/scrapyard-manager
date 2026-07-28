export type CarStatus =
  | 'arrived'
  | 'dismantling'
  | 'complete'
  | 'crushed'
  | 'sold';

export type PartStatus = 'available' | 'reserved' | 'sold' | 'scrapped';

export type PartCondition =
  | 'new'
  | 'used_excellent'
  | 'used_good'
  | 'used_fair'
  | 'salvage';

export type PartCategory =
  | 'engine'
  | 'transmission'
  | 'body'
  | 'interior'
  | 'electrical'
  | 'suspension'
  | 'brakes'
  | 'wheels'
  | 'glass'
  | 'other';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  status: CarStatus;
  yardLocation: string | null;
  arrivalDate: string | null;
  purchasePrice: number;
  notes: string | null;
  odometer: number;
  parts?: Part[];
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  sku: string | null;
  condition: PartCondition;
  status: PartStatus;
  price: number;
  quantity: number;
  binLocation: string | null;
  notes: string | null;
  carId: string | null;
  car?: Car | null;
  createdAt: string;
  updatedAt: string;
}

export interface YardStats {
  totalCars: number;
  totalParts: number;
  availableParts: number;
  reservedParts: number;
  soldParts: number;
  inventoryValue: number;
  carsByStatus: { status: CarStatus; count: number }[];
  partsByCategory: { category: PartCategory; count: number }[];
  recentCars: Car[];
  recentParts: Part[];
  dbSource: 'neon' | 'memory';
}

export const CAR_STATUSES: CarStatus[] = [
  'arrived',
  'dismantling',
  'complete',
  'crushed',
  'sold',
];

export const PART_STATUSES: PartStatus[] = [
  'available',
  'reserved',
  'sold',
  'scrapped',
];

export const PART_CATEGORIES: PartCategory[] = [
  'engine',
  'transmission',
  'body',
  'interior',
  'electrical',
  'suspension',
  'brakes',
  'wheels',
  'glass',
  'other',
];

export const PART_CONDITIONS: PartCondition[] = [
  'new',
  'used_excellent',
  'used_good',
  'used_fair',
  'salvage',
];

export function labelStatus(value: string): string {
  return value.replace(/_/g, ' ');
}

export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
