import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog';
import { ProductService } from '../../../../core/services/product.service';
import { ProductResponse } from '../../../../core/models/product.model';


@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ConfirmDialogComponent],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent implements OnInit {
  productService = inject(ProductService);

  products = signal<ProductResponse[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Which product (if any) the confirm modal is currently asking about.
  pendingDeleteId = signal<number | null>(null);

  ngOnInit() {
    this.load();
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

    this.productService.delete(id).subscribe({
      next: () => {
        this.pendingDeleteId.set(null);
        this.load();
      },
      error: (err) => {
        this.pendingDeleteId.set(null);
        this.errorMessage.set(err?.error?.error ?? 'Could not delete this product.');
      },
    });
  }
}