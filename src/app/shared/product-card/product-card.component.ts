import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() variant: 'standard' | 'featured' | 'compact' = 'standard';

  cart = inject(CartService);
  productService = inject(ProductService);

  added = signal(false);

  get displayPrice(): number {
    return this.productService.getMinPrice(this.product);
  }

  get hasVariants(): boolean {
    return (this.product.variants?.length ?? 0) > 1;
  }

  get category(): string {
    if (this.product.subCategory) return this.product.subCategory;
    return this.product.mainCategory || this.product.parentCategory || this.product.category || '';
  }

  get subCategory(): string {
    return this.product.subCategory || '';
  }

  get timber(): string {
    return this.product.timber || '';
  }

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const variant = this.product.variants?.[0];
    const variantLabel = variant?.label || variant?.type || 'Standard';
    const price = variant?.price ?? this.product.price ?? 0;

    this.cart.addItem(this.product, variantLabel, price);

    // Brief "added" feedback
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1800);
  }

  formatPrice(n: number): string {
    return this.productService.formatPrice(n);
  }
}
