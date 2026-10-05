import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { ProductPublicResponse } from '../../core/models/product.model';
import { CategoryPublicResponse } from '../../core/models/category.model';
import { ButtonComponent } from '../../shared/button/button';
import { IconComponent } from '../../shared/icon/icon';
import { LazyImgDirective } from '../../shared/lazy-img/lazy-img';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { RevealDirective } from '../../shared/reveal/reveal';
import { SelectComponent, SelectOption } from '../../shared/select/select';
import { SkeletonComponent } from '../../shared/sceleton/sceleton';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    IconComponent,
    LazyImgDirective,
    PageHeaderComponent,
    RevealDirective,
    SelectComponent,
    SkeletonComponent,
  ],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private translate = inject(TranslateService);
  cartService = inject(CartService);

  products = signal<ProductPublicResponse[]>([]);
  categories = signal<CategoryPublicResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  readonly skeletonCount = [1, 2, 3, 4, 5, 6, 7, 8];

  searchTerm = '';
  selectedCategoryId: number | null = null;
  page = signal(0);
  totalPages = signal(0);

  addedId = signal<number | null>(null);
  private addedTimer: ReturnType<typeof setTimeout> | undefined;
  private allLabel = toSignal(this.translate.stream('catalog.allCategories') as Observable<string>, {
    initialValue: '',
  });

  categoryOptions = computed<SelectOption[]>(() => [
    { value: null, label: this.allLabel() },
    ...this.categories().map((c) => ({ value: c.id, label: c.name })),
  ]);

  ngOnInit() {
    this.categoryService.listPublic('AL').subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
      },
    });

    this.load();
  }

  ngOnDestroy() {
    clearTimeout(this.addedTimer);
  }

  load() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService
      .listPublic({
        categoryId: this.selectedCategoryId ?? undefined,
        search: this.searchTerm || undefined,
        page: this.page(),
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.products.set(result.content);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.errorMessage.set('Could not load products.');
          this.loading.set(false);
        },
      });
  }

  onFilterChange() {
    this.page.set(0);
    this.load();
  }

  clearSearch() {
    this.searchTerm = '';
    this.onFilterChange();
  }

  goToPage(next: number) {
    if (next < 0 || next >= this.totalPages()) {
      return;
    }
    this.page.set(next);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addToCart(product: ProductPublicResponse) {
    this.cartService.add(product, 1);
    this.addedId.set(product.id);
    clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.addedId.set(null), 1400);
  }
}