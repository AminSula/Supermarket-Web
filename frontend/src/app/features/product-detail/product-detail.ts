import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ProductPublicResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  cartService = inject(CartService);

  product = signal<ProductPublicResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  quantity = signal(1);
  added = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.productService.getPublic(id, 'AL').subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Product not found.');
        this.loading.set(false);
      },
    });
  }

  addToCart() {
    const product = this.product();
    if (!product) {
      return;
    }

    this.cartService.add(product, this.quantity());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }
}