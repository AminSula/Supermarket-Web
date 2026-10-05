import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog';
import { ButtonComponent } from '../../../../shared/button/button';
import { IconComponent } from '../../../../shared/icon/icon';
import { LazyImgDirective } from '../../../../shared/lazy-img/lazy-img';
import { PageHeaderComponent } from '../../../../shared/page-header/page-header';
import { RevealDirective } from '../../../../shared/reveal/reveal';
import { SkeletonComponent } from '../../../../shared/sceleton/sceleton';
import { ProductService } from '../../../../core/services/product.service';
import { ProductResponse } from '../../../../core/models/product.model';

const LABEL_KEYS = [
  'admin.products.archived',
  'admin.products.restore',
  'admin.products.deletePermanentMessage',
  'admin.products.deleteArchiveMessage',
  'admin.products.deletedNotice',
  'admin.products.archivedNotice',
  'admin.products.restoredNotice',
];

type Filter = 'active' | 'archived';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ConfirmDialogComponent,
    ButtonComponent,
    IconComponent,
    LazyImgDirective,
    PageHeaderComponent,
    RevealDirective,
    SkeletonComponent,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent implements OnInit, OnDestroy {
  productService = inject(ProductService);
  private translate = inject(TranslateService);

  products = signal<ProductResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  filter = signal<Filter>('active');
  activeProducts = computed(() => this.products().filter((p) => p.active));
  archivedProducts = computed(() => this.products().filter((p) => !p.active));
  visibleProducts = computed(() => (this.filter() === 'active' ? this.activeProducts() : this.archivedProducts()));

  pendingDeleteId = signal<number | null>(null);
  private pendingDelete = computed(() => this.products().find((p) => p.id === this.pendingDeleteId()) ?? null);

  deleteMessage = computed(() =>
    this.pendingDelete()?.hasOrders
      ? this.t(
          'admin.products.deleteArchiveMessage',
          'This product appears in past orders, so it will be archived instead of erased. It disappears from the store, and you can restore it anytime from the Archived tab.',
        )
      : this.t(
          'admin.products.deletePermanentMessage',
          "This permanently deletes the product and its images. This can't be undone.",
        ),
  );

  restoringId = signal<number | null>(null);

  notice = signal<string | null>(null);
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  private labels = toSignal(this.translate.stream(LABEL_KEYS), { initialValue: {} as Record<string, string> });

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    clearTimeout(this.noticeTimer);
  }

  t(key: string, fallback: string): string {
    const value = this.labels()[key];
    return value && value !== key ? value : fallback;
  }

  load() {
    this.loading.set(true);
    this.productService.listAdmin().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load products.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: Filter) {
    this.filter.set(filter);
  }

  askDelete(id: number) {
    this.pendingDeleteId.set(id);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
  }

  confirmDelete() {
    const id = this.pendingDeleteId();
    if (id == null) {
      return;
    }

    this.errorMessage.set(null);
    this.productService.delete(id).subscribe({
      next: (result) => {
        this.pendingDeleteId.set(null);

        if (result.archived) {
          this.products.update((list) => list.map((p) => (p.id === id ? { ...p, active: false } : p)));
          this.showNotice(
            this.t(
              'admin.products.archivedNotice',
              'Product archived — it appears in past orders. You can restore it from the Archived tab.',
            ),
          );
        } else {
          // Never ordered: really gone.
          this.products.update((list) => list.filter((p) => p.id !== id));
          this.showNotice(this.t('admin.products.deletedNotice', 'Product deleted.'));
        }
        this.leaveEmptyArchive();
      },
      error: (err) => {
        this.pendingDeleteId.set(null);
        this.errorMessage.set(err?.error?.error ?? 'Could not delete this product.');
      },
    });
  }

  restore(product: ProductResponse) {
    this.restoringId.set(product.id);
    this.errorMessage.set(null);

    this.productService.restore(product.id).subscribe({
      next: (restored) => {
        this.products.update((list) => list.map((p) => (p.id === restored.id ? restored : p)));
        this.restoringId.set(null);
        this.showNotice(this.t('admin.products.restoredNotice', 'Product restored to the store.'));
        this.leaveEmptyArchive();
      },
      error: (err) => {
        this.restoringId.set(null);
        this.errorMessage.set(err?.error?.error ?? 'Could not restore this product.');
      },
    });
  }

  dismissNotice() {
    clearTimeout(this.noticeTimer);
    this.notice.set(null);
  }

  private showNotice(message: string) {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 7000);
  }

  // The Archived tab only exists while something is archivedt.
  private leaveEmptyArchive() {
    if (this.filter() === 'archived' && this.archivedProducts().length === 0) {
      this.filter.set('active');
    }
  }
}