import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderCreateRequest, OrderResponse } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly url = '/api/orders';

  constructor(private http: HttpClient) {}

  placeOrder(request: OrderCreateRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.url, request);
  }
}