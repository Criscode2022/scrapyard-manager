import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import {
  CAR_STATUSES,
  Car,
  CarStatus,
  labelStatus,
} from '../../core/models';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './cars.component.html',
  styleUrl: './cars.component.scss',
})
export class CarsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly cars = signal<Car[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<Car | null>(null);

  readonly statuses = CAR_STATUSES;
  readonly labelStatus = labelStatus;

  filterStatus = '';
  filterQ = '';

  form = this.emptyForm();

  ngOnInit() {
    this.reload();
  }

  emptyForm() {
    return {
      make: '',
      model: '',
      year: new Date().getFullYear() - 8,
      vin: '',
      color: '',
      status: 'arrived' as CarStatus,
      yardLocation: '',
      arrivalDate: new Date().toISOString().slice(0, 10),
      purchasePrice: 0,
      odometer: 0,
      notes: '',
    };
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listCars({
        status: this.filterStatus || undefined,
        q: this.filterQ || undefined,
      })
      .subscribe({
        next: (rows) => {
          this.cars.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load cars.');
          this.loading.set(false);
        },
      });
  }

  openCreate() {
    this.editing.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  openEdit(car: Car) {
    this.editing.set(car);
    this.form = {
      make: car.make,
      model: car.model,
      year: car.year,
      vin: car.vin ?? '',
      color: car.color ?? '',
      status: car.status,
      yardLocation: car.yardLocation ?? '',
      arrivalDate: car.arrivalDate ?? '',
      purchasePrice: Number(car.purchasePrice),
      odometer: car.odometer,
      notes: car.notes ?? '',
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save() {
    if (!this.form.make.trim() || !this.form.model.trim()) return;
    this.saving.set(true);
    const body = {
      ...this.form,
      vin: this.form.vin || undefined,
      color: this.form.color || undefined,
      yardLocation: this.form.yardLocation || undefined,
      notes: this.form.notes || undefined,
    };
    const edit = this.editing();
    const req = edit
      ? this.api.updateCar(edit.id, body)
      : this.api.createCar(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.reload();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Could not save car.');
      },
    });
  }

  remove(car: Car) {
    if (!confirm(`Remove ${car.year} ${car.make} ${car.model} from the yard?`))
      return;
    this.api.deleteCar(car.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Could not delete car.'),
    });
  }
}
