import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car, Part, YardStats } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getStats(): Observable<YardStats> {
    return this.http.get<YardStats>(`${this.base}/stats`);
  }

  listCars(params?: { status?: string; q?: string }): Observable<Car[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<Car[]>(`${this.base}/cars`, { params: httpParams });
  }

  getCar(id: string): Observable<Car> {
    return this.http.get<Car>(`${this.base}/cars/${id}`);
  }

  createCar(body: Partial<Car>): Observable<Car> {
    return this.http.post<Car>(`${this.base}/cars`, body);
  }

  updateCar(id: string, body: Partial<Car>): Observable<Car> {
    return this.http.patch<Car>(`${this.base}/cars/${id}`, body);
  }

  deleteCar(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/cars/${id}`);
  }

  listParts(params?: {
    status?: string;
    category?: string;
    carId?: string;
    q?: string;
  }): Observable<Part[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category)
      httpParams = httpParams.set('category', params.category);
    if (params?.carId) httpParams = httpParams.set('carId', params.carId);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<Part[]>(`${this.base}/parts`, { params: httpParams });
  }

  getPart(id: string): Observable<Part> {
    return this.http.get<Part>(`${this.base}/parts/${id}`);
  }

  createPart(body: Partial<Part>): Observable<Part> {
    return this.http.post<Part>(`${this.base}/parts`, body);
  }

  updatePart(id: string, body: Partial<Part>): Observable<Part> {
    return this.http.patch<Part>(`${this.base}/parts/${id}`, body);
  }

  deletePart(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/parts/${id}`);
  }
}
