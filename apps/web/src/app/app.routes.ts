import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'cars',
    loadComponent: () =>
      import('./pages/cars/cars.component').then((m) => m.CarsComponent),
  },
  {
    path: 'cars/:id',
    loadComponent: () =>
      import('./pages/car-detail/car-detail.component').then(
        (m) => m.CarDetailComponent,
      ),
  },
  {
    path: 'parts',
    loadComponent: () =>
      import('./pages/parts/parts.component').then((m) => m.PartsComponent),
  },
  { path: '**', redirectTo: '' },
];
