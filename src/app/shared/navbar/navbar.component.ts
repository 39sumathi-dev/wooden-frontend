import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  cart = inject(CartService);
  productService = inject(ProductService);
  private router = inject(Router);

  isScrolled = signal(false);
  mobileOpen = signal(false);
  megaMenuOpen = signal(false);
  mobileCollectionsOpen = signal(true);
  mobileExpandedCategory = signal<string | null>('functional-homeware');

  categories = this.productService.categoryTree;

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 60);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMegaMenu();
    this.closeMobile();
  }

  ngOnInit() {
    this.isScrolled.set(window.scrollY > 60);
    this.productService.loadProducts().subscribe();
  }

  toggleMegaMenu(event?: Event) {
    if (event) event.preventDefault();
    this.megaMenuOpen.update(v => !v);
  }

  openMegaMenu() {
    this.megaMenuOpen.set(true);
  }

  closeMegaMenu() {
    this.megaMenuOpen.set(false);
  }

  toggleMobile() {
    this.mobileOpen.update(v => !v);
    document.body.style.overflow = this.mobileOpen() ? 'hidden' : '';
  }

  closeMobile() {
    this.mobileOpen.set(false);
    this.closeMegaMenu();
    document.body.style.overflow = '';
  }

  toggleMobileCollections() {
    this.mobileCollectionsOpen.update(v => !v);
  }

  toggleMobileCategory(catSlug: string) {
    if (this.mobileExpandedCategory() === catSlug) {
      this.mobileExpandedCategory.set(null);
    } else {
      this.mobileExpandedCategory.set(catSlug);
    }
  }

  navigateToCategory(catSlug: string, subSlug?: string) {
    this.productService.setCategory(catSlug, subSlug);
    this.closeMegaMenu();
    this.closeMobile();

    const queryParams: Record<string, string> = { category: catSlug };
    if (subSlug && subSlug !== 'all') {
      queryParams['subCategory'] = subSlug;
    }
    this.router.navigate(['/shop'], { queryParams });
  }

  navigateToFeatured() {
    this.productService.setFeaturedOnly(true);
    this.productService.setCategory('all');
    this.closeMegaMenu();
    this.closeMobile();
    this.router.navigate(['/shop'], { queryParams: { featured: 'true' } });
  }

  navigateToShopAll() {
    this.productService.clearFilters();
    this.closeMegaMenu();
    this.closeMobile();
    this.router.navigate(['/shop']);
  }
}
