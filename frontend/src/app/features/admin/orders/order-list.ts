import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrderService, OrderStatus } from '../../../core/services/order.service';
import { OrderResponse } from '../../../core/models/order.model';
import { IconComponent } from '../../../shared/icon/icon';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { RevealDirective } from '../../../shared/reveal/reveal';
import { SelectComponent, SelectOption } from '../../../shared/select/select';
import { SkeletonComponent } from '../../../shared/sceleton/sceleton';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IconComponent,
    PageHeaderComponent,
    RevealDirective,
    SelectComponent,
    SkeletonComponent,
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  private translate = inject(TranslateService);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  statusFilter = signal<OrderStatus | ''>('');
  expandedId = signal<number | null>(null);

  readonly statuses = STATUSES;

  private labels = toSignal(
    this.translate.stream(['admin.orders.allStatuses', ...STATUSES.map((s) => 'admin.orders.status.' + s)]),
    { initialValue: {} as Record<string, string> },
  );

  statusOptions = computed<SelectOption[]>(() =>
    STATUSES.map((s) => ({ value: s, label: this.labels()['admin.orders.status.' + s] ?? s })),
  );

  filterOptions = computed<SelectOption[]>(() => [
    { value: '', label: this.labels()['admin.orders.allStatuses'] ?? '' },
    ...this.statusOptions(),
  ]);

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

  initials(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase() || '?'
    );
  }

  changeStatus(order: OrderResponse, newStatus: string) {
    const status = newStatus as OrderStatus;
    if (status === order.status) {
      return;
    }

    this.orderService.updateStatus(order.id, status).subscribe({
      next: () => {
        const filter = this.statusFilter();
        this.orders.update((list) =>
          list
            .map((o) => (o.id === order.id ? { ...o, status } : o))
            .filter((o) => !filter || o.status === filter),
        );
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.error ?? 'Could not update this order.');
        this.load(); 
      },
    });
  }
}