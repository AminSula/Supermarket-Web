import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderCreateRequest, OrderResponse } from '../models/order.model';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly url = '/api/orders';
  private readonly adminUrl = '/api/admin/orders';

  constructor(private http: HttpClient) {}

  placeOrder(request: OrderCreateRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.url, request);
  }

  listAdmin(status?: OrderStatus): Observable<OrderResponse[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<OrderResponse[]>(this.adminUrl, { params });
  }

  getAdmin(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.adminUrl}/${id}`);
  }

  updateStatus(id: number, status: OrderStatus): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.adminUrl}/${id}/status`, { status });
  }
}