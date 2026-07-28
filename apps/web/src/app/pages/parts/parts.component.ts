import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import {
  Car,
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_STATUSES,
  Part,
  PartCategory,
  PartCondition,
  PartStatus,
} from '../../core/models';

@Component({
  selector: 'app-parts',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, TitleCasePipe],
  templateUrl: './parts.component.html',
  styleUrl: './parts.component.scss',
})
export class PartsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly parts = signal<Part[]>([]);
  readonly cars = signal<Car[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<Part | null>(null);
  readonly view = signal<'cards' | 'table'>('cards');

  readonly statuses = PART_STATUSES;
  readonly categories = PART_CATEGORIES;
  readonly conditions = PART_CONDITIONS;

  filterStatus = '';
  filterCategory = '';
  filterQ = '';
  form = this.emptyForm();

  ngOnInit() {
    this.api.listCars().subscribe({ next: (cars) => this.cars.set(cars) });
    this.reload();
  }

  emptyForm() {
    return {
      name: '',
      category: 'other' as PartCategory,
      condition: 'used_good' as PartCondition,
      status: 'available' as PartStatus,
      price: 0,
      quantity: 1,
      sku: '',
      binLocation: '',
      notes: '',
      carId: '' as string,
    };
  }

  setView(mode: 'cards' | 'table') {
    this.view.set(mode);
  }

  conditionLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listParts({
        status: this.filterStatus || undefined,
        category: this.filterCategory || undefined,
        q: this.filterQ || undefined,
      })
      .subscribe({
        next: (rows) => {
          this.parts.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load parts.');
          this.loading.set(false);
        },
      });
  }

  openCreate() {
    this.editing.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  openEdit(part: Part) {
    this.editing.set(part);
    this.form = {
      name: part.name,
      category: part.category,
      condition: part.condition,
      status: part.status,
      price: Number(part.price),
      quantity: part.quantity,
      sku: part.sku ?? '',
      binLocation: part.binLocation ?? '',
      notes: part.notes ?? '',
      carId: part.carId ?? '',
    };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    const body = {
      name: this.form.name,
      category: this.form.category,
      condition: this.form.condition,
      status: this.form.status,
      price: this.form.price,
      quantity: this.form.quantity,
      sku: this.form.sku || undefined,
      binLocation: this.form.binLocation || undefined,
      notes: this.form.notes || undefined,
      carId: this.form.carId || undefined,
    };
    const edit = this.editing();
    const req = edit
      ? this.api.updatePart(edit.id, body)
      : this.api.createPart(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.reload();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Could not save part.');
      },
    });
  }

  remove(part: Part) {
    if (!confirm(`Delete part "${part.name}"?`)) return;
    this.api.deletePart(part.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Could not delete part.'),
    });
  }

  carLabel(part: Part): string {
    if (part.car) {
      return `${part.car.year} ${part.car.make} ${part.car.model}`;
    }
    return '—';
  }
}
