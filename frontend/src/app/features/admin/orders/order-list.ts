import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { OrderService, OrderStatus } from '../../../core/services/order.service';
import { OrderResponse } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  statusFilter = signal<OrderStatus | ''>('');
  expandedId = signal<number | null>(null);

  readonly statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filter = this.statusFilter() || undefined;
    this.orderService.listAdmin(filter).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load orders.');
        this.loading.set(false);
      },
    });
  }

  onFilterChange() {
    this.load();
  }

  toggleExpand(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  changeStatus(order: OrderResponse, newStatus: string) {
    const status = newStatus as OrderStatus;
    if (status === order.status) {
      return;
    }

    this.orderService.updateStatus(order.id, status).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.errorMessage.set(err?.error?.error ?? 'Could not update this order.');
      },
    });
  }
}