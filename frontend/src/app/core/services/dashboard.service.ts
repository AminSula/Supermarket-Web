import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardSummary,
  OrderStatusCount,
  RevenuePoint,
  TopProduct,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = '/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  topProducts(limit = 5): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.baseUrl}/top-products`, { params: { limit } });
  }

  revenueOverTime(days = 14): Observable<RevenuePoint[]> {
    return this.http.get<RevenuePoint[]>(`${this.baseUrl}/revenue-over-time`, { params: { days } });
  }

  ordersByStatus(): Observable<OrderStatusCount[]> {
    return this.http.get<OrderStatusCount[]>(`${this.baseUrl}/orders-by-status`);
  }
}