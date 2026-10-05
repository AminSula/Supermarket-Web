import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { ButtonComponent } from '../../shared/button/button';
import { CountUpDirective } from '../../shared/count-up/count-up';
import { IconComponent } from '../../shared/icon/icon';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { QuantityStepperComponent } from '../../shared/quantity-stepper/quantity-stepper';
import { RevealDirective } from '../../shared/reveal/reveal';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    CountUpDirective,
    IconComponent,
    PageHeaderComponent,
    QuantityStepperComponent,
    RevealDirective,
  ],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPageComponent {
  cartService = inject(CartService);

  updateQuantity(productId: number, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  remove(productId: number) {
    this.cartService.remove(productId);
  }
}