import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  TitleCasePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
  CAR_STATUSES,
  Car,
  Part,
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_STATUSES,
  PartCategory,
  PartCondition,
  PartStatus,
} from '../../core/models';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
  ],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.scss',
})
export class CarDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly car = signal<Car | null>(null);
  readonly parts = signal<Part[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showPartForm = signal(false);
  readonly saving = signal(false);

  readonly statuses = CAR_STATUSES;
  readonly partStatuses = PART_STATUSES;
  readonly categories = PART_CATEGORIES;
  readonly conditions = PART_CONDITIONS;

  partForm = {
    name: '',
    category: 'other' as PartCategory,
    condition: 'used_good' as PartCondition,
    status: 'available' as PartStatus,
    price: 0,
    quantity: 1,
    sku: '',
    binLocation: '',
    notes: '',
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/cars']);
      return;
    }
    this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.api.getCar(id).subscribe({
      next: (car) => {
        this.car.set(car);
        this.parts.set(car.parts ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Car not found.');
        this.loading.set(false);
      },
    });
  }

  updateStatus(status: string) {
    const car = this.car();
    if (!car) return;
    this.api.updateCar(car.id, { status: status as Car['status'] }).subscribe({
      next: (updated) => this.car.set({ ...updated, parts: this.parts() }),
    });
  }

  openPartForm() {
    this.partForm = {
      name: '',
      category: 'other',
      condition: 'used_good',
      status: 'available',
      price: 0,
      quantity: 1,
      sku: '',
      binLocation: '',
      notes: '',
    };
    this.showPartForm.set(true);
  }

  savePart() {
    const car = this.car();
    if (!car || !this.partForm.name.trim()) return;
    this.saving.set(true);
    this.api
      .createPart({
        ...this.partForm,
        carId: car.id,
        sku: this.partForm.sku || undefined,
        binLocation: this.partForm.binLocation || undefined,
        notes: this.partForm.notes || undefined,
      })
      .subscribe({
        next: (part) => {
          this.parts.update((rows) => [part, ...rows]);
          this.saving.set(false);
          this.showPartForm.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  conditionLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }
}
