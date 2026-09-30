import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { ProductPublicResponse } from '../../core/models/product.model';
import { CategoryPublicResponse } from '../../core/models/category.model';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPageComponent implements OnInit {
  productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  cartService = inject(CartService);

  products = signal<ProductPublicResponse[]>([]);
  categories = signal<CategoryPublicResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  searchTerm = '';
  selectedCategoryId: number | null = null;
  page = signal(0);
  totalPages = signal(0);

  ngOnInit() {
    this.categoryService.listPublic('AL').subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
        /* category filter is a nice-to-have; the product list still works without it */
      },
    });

    this.load();
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

  // Any filter change resets to page 0 — otherwise you could land on a
  // page number that no longer exists for the new filter/search.
  onFilterChange() {
    this.page.set(0);
    this.load();
  }

  goToPage(next: number) {
    if (next < 0 || next >= this.totalPages()) {
      return;
    }
    this.page.set(next);
    this.load();
  }

  openProduct(id: number) {
    this.router.navigate(['/products', id]);
  }

  addToCart(event: Event, product: ProductPublicResponse) {
    event.stopPropagation(); // don't also trigger the card's openProduct click
    this.cartService.add(product, 1);
  }
}