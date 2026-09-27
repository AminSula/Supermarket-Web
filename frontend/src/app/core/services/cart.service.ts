import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/order.model';
import { ProductPublicResponse } from '../models/product.model';

const CART_KEY = 'supermarket_cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(loadCart());

  readonly cartItems = this.items.asReadonly();
  readonly itemCount = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.quantity, 0));

  add(product: ProductPublicResponse, quantity = 1) {
    const current = this.items();
    const existing = current.find((i) => i.productId === product.id);

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock);
      this.setItems(current.map((i) => (i.productId === product.id ? { ...i, quantity: newQty } : i)));
    } else {
      this.setItems([
        ...current,
        { productId: product.id, name: product.name, price: product.price, quantity, stock: product.stock },
      ]);
    }
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }

    this.setItems(
      this.items().map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i))
    );
  }

  remove(productId: number) {
    this.setItems(this.items().filter((i) => i.productId !== productId));
  }

  clear() {
    this.setItems([]);
  }

  private setItems(items: CartItem[]) {
    this.items.set(items);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}