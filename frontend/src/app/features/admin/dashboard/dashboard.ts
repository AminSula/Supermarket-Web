import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import {
  DashboardSummary,
  OrderStatusCount,
  RevenuePoint,
  TopProduct,
} from '../../../core/models/dashboard.model';
import { IconComponent, IconName } from '../../../shared/icon/icon';
import { RevealDirective } from '../../../shared/reveal/reveal';
import { CountUpDirective } from '../../../shared/count-up/count-up';
import { InViewDirective } from '../../../shared/in-view/in-view';
import { PageHeaderComponent } from '../../../shared/page-header/page-header';
import { SkeletonComponent } from '../../../shared/sceleton/sceleton';

interface SummaryCard {
  key: 'today' | 'thisWeek' | 'thisMonth'; 
  icon: IconName;
  revenue: number;
  orders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IconComponent,
    RevealDirective,
    CountUpDirective,
    InViewDirective,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);

  summary = signal<DashboardSummary | null>(null);
  topProducts = signal<TopProduct[]>([]);
  revenuePoints = signal<RevenuePoint[]>([]);
  statusCounts = signal<OrderStatusCount[]>([]);

  cards = computed<SummaryCard[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { key: 'today', icon: 'clock', revenue: s.revenueToday, orders: s.ordersToday },
      { key: 'thisWeek', icon: 'calendar', revenue: s.revenueThisWeek, orders: s.ordersThisWeek },
      { key: 'thisMonth', icon: 'calendar-check', revenue: s.revenueThisMonth, orders: s.ordersThisMonth },
    ];
  });

  private maxRevenue = computed(() => Math.max(...this.revenuePoints().map((p) => p.revenue), 0) || 1);
  private statusTotal = computed(() => this.statusCounts().reduce((sum, s) => sum + s.count, 0) || 1);
  private topMax = computed(() => Math.max(...this.topProducts().map((p) => p.revenue), 0) || 1);

  ngOnInit() {
    forkJoin({
      summary: this.dashboardService.summary(),
      topProducts: this.dashboardService.topProducts(5),
      revenue: this.dashboardService.revenueOverTime(14),
      statuses: this.dashboardService.ordersByStatus(),
    }).subscribe({
      next: (result) => {
        this.summary.set(result.summary);
        this.topProducts.set(result.topProducts);
        this.revenuePoints.set(result.revenue);
        this.statusCounts.set(result.statuses);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard:', err);
        this.errorMessage.set('Could not load the dashboard.');
        this.loading.set(false);
      },
    });
  }

  barHeight(point: RevenuePoint): number {
    return (point.revenue / this.maxRevenue()) * 100;
  }

  statusShare(item: OrderStatusCount): number {
    return (item.count / this.statusTotal()) * 100;
  }

  productShare(product: TopProduct): number {
    return (product.revenue / this.topMax()) * 100;
  }

  statusIcon(status: OrderStatusCount['status']): IconName {
    const icons: Record<OrderStatusCount['status'], IconName> = {
      PENDING: 'clock',
      CONFIRMED: 'check-circle',
      DELIVERED: 'truck',
      CANCELLED: 'x-circle',
    };
    return icons[status];
  }

  shortDate(isoDate: string): string {
    const [, month, day] = isoDate.split('-');
    return `${Number(day)}/${Number(month)}`;
  }
}