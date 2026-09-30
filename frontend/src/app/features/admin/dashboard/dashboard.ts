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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
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

  // Tallest bar = 100% of the chart height; everything else scales against it.
  // `|| 1` avoids dividing by zero when there's no revenue at all yet.
  private maxRevenue = computed(() => Math.max(...this.revenuePoints().map((p) => p.revenue), 0) || 1);

  ngOnInit() {
    // All four are independent, so fetch them together.
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

  // "2026-09-27" -> "27/9" — compact enough to fit under each bar.
  shortDate(isoDate: string): string {
    const [, month, day] = isoDate.split('-');
    return `${Number(day)}/${Number(month)}`;
  }
}