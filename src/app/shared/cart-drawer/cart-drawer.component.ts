import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss'
})
export class CartDrawerComponent {
  cart = inject(CartService);
  productService = inject(ProductService);

  updateQty(productId: string, variantLabel: string, qty: number) {
    this.cart.updateQuantity(productId, variantLabel, qty);
  }

  remove(productId: string, variantLabel: string) {
    this.cart.removeItem(productId, variantLabel);
  }

  formatPrice(amount: number): string {
    return this.productService.formatPrice(amount);
  }
}
