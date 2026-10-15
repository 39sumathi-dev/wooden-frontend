import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product, Variant } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  productService = inject(ProductService);
  cart = inject(CartService);
  route = inject(ActivatedRoute);

  product = signal<Product | null>(null);
  selectedVariant = signal<Variant | null>(null);
  selectedImageIndex = signal(0);
  quantity = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);
  addedToCart = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadProduct(id);
    });
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.productService.loadProducts().subscribe(() => {
      this.productService.getProductById(id).subscribe(product => {
        if (product) {
          this.product.set(product);
          if (product.variants && product.variants.length > 0) {
            this.selectedVariant.set(product.variants[0]);
          }
        } else {
          this.error.set('Product not found.');
        }
        this.loading.set(false);
      });
    });
  }

  selectVariant(variant: Variant) {
    this.selectedVariant.set(variant);
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  decrementQty() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  incrementQty() {
    this.quantity.update(q => q + 1);
  }

  get currentPrice(): number {
    const v = this.selectedVariant();
    if (v) return v.price;
    return this.productService.getMinPrice(this.product()!);
  }

  get variantLabel(): string {
    const v = this.selectedVariant();
    return v?.label || v?.type || 'Standard';
  }

  addToCart() {
    const p = this.product();
    if (!p) return;

    this.cart.addItem(p, this.variantLabel, this.currentPrice, this.quantity());

    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
  }

  get relatedProducts() {
    const p = this.product();
    if (!p) return [];
    const all = this.productService.allProducts().filter(x => x.id !== p.id);
    const sameSub = all.filter(x => p.subCategory && x.subCategory === p.subCategory);
    const sameMain = all.filter(x => !sameSub.includes(x) && (
      (p.mainCategory && x.mainCategory === p.mainCategory) ||
      (p.parentCategory && x.parentCategory === p.parentCategory)
    ));
    return [...sameSub, ...sameMain].slice(0, 3);
  }

  formatPrice(n: number): string {
    return this.productService.formatPrice(n);
  }
}
