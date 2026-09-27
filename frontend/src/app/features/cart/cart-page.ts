import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPageComponent {
  cartService = inject(CartService);
  private router = inject(Router);

  updateQuantity(productId: number, quantity: string) {
    this.cartService.updateQuantity(productId, Number(quantity));
  }

  remove(productId: number) {
    this.cartService.remove(productId);
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }
}