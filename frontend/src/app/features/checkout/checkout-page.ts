import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { OrderResponse } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPageComponent {
  private fb = inject(FormBuilder);
  cartService = inject(CartService);
  private orderService = inject(OrderService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  completedOrder = signal<OrderResponse | null>(null);

  form = this.fb.group({
    customerName: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    notes: [''],
  });

  submit() {
    if (this.form.invalid || this.cartService.cartItems().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

    this.orderService
      .placeOrder({
        customerName: value.customerName!,
        phone: value.phone!,
        address: value.address!,
        notes: value.notes || undefined,
        items: this.cartService.cartItems().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.completedOrder.set(order);
          this.cartService.clear();
        },
        error: (err) => {
          this.submitting.set(false);
          // Most likely a 409 (stock changed since it was added to cart) or a 404 (product removed).
          this.errorMessage.set(err?.error?.error ?? 'Something went wrong. Please try again.');
        },
      });
  }
}