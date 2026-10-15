import { Injectable, signal, computed } from '@angular/core';
import { CartItem, Product, Variant } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);
  private _open = signal(false);

  items = this._items.asReadonly();
  isOpen = this._open.asReadonly();

  count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  total = computed(() => this._items().reduce((sum, i) => sum + i.price * i.quantity, 0));

  // Add or increment an item
  addItem(product: Product, variantLabel: string, price: number, qty = 1) {
    const current = this._items();
    const existing = current.find(
      i => i.product.id === product.id && i.variantLabel === variantLabel
    );

    if (existing) {
      this._items.set(current.map(i =>
        i.product.id === product.id && i.variantLabel === variantLabel
          ? { ...i, quantity: i.quantity + qty }
          : i
      ));
    } else {
      this._items.set([...current, { product, variantLabel, price, quantity: qty }]);
    }

    // Open cart drawer on add
    this.openCart();
  }

  // Remove an item
  removeItem(productId: string, variantLabel: string) {
    this._items.set(
      this._items().filter(i => !(i.product.id === productId && i.variantLabel === variantLabel))
    );
  }

  // Update quantity (removes if qty <= 0)
  updateQuantity(productId: string, variantLabel: string, qty: number) {
    if (qty <= 0) { this.removeItem(productId, variantLabel); return; }
    this._items.set(this._items().map(i =>
      i.product.id === productId && i.variantLabel === variantLabel
        ? { ...i, quantity: qty }
        : i
    ));
  }

  clearCart() { this._items.set([]); }

  openCart() { this._open.set(true); }
  closeCart() { this._open.set(false); }
  toggleCart() { this._open.set(!this._open()); }
}
