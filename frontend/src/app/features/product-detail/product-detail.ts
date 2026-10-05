import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ProductPublicResponse } from '../../core/models/product.model';
import { ButtonComponent } from '../../shared/button/button';
import { IconComponent } from '../../shared/icon/icon';
import { ImageCarouselComponent } from '../../shared/image-carousel/image-carousel';
import { QuantityStepperComponent } from '../../shared/quantity-stepper/quantity-stepper';
import { RevealDirective } from '../../shared/reveal/reveal';
import { SkeletonComponent } from '../../shared/sceleton/sceleton';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    IconComponent,
    ImageCarouselComponent,
    QuantityStepperComponent,
    RevealDirective,
    SkeletonComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  cartService = inject(CartService);

  product = signal<ProductPublicResponse | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);
  quantity = signal(1);

  imageUrls = computed(() => {
    const product = this.product();
    return product ? product.imageIds.map((imageId) => this.productService.imageUrl(product.id, imageId)) : [];
  });

  added = signal(false); 
  hasAdded = signal(false); 
  private addedTimer: ReturnType<typeof setTimeout> | undefined;

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

  ngOnDestroy() {
    clearTimeout(this.addedTimer);
  }

  addToCart() {
    const product = this.product();
    if (!product) {
      return;
    }

    this.cartService.add(product, this.quantity());
    this.added.set(true);
    this.hasAdded.set(true);
    clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.added.set(false), 2000);
  }
}