import { Component, OnInit, inject, AfterViewInit, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';
import { CategoryGroup, SubCategory } from '../../core/models/product.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit, AfterViewInit {
  productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private el = inject(ElementRef);

  sortOptions = [
    { value: 'default', label: 'Featured First' },
    { value: 'new', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
  ];

  selectedSort = 'default';
  searchInput = '';

  // Active Category information for header banner
  activeGroup = this.productService.currentCategoryGroup;
  activeSub = this.productService.currentSubCategory;

  headerTitle = computed(() => {
    const sub = this.activeSub();
    if (sub) return sub.name;
    const group = this.activeGroup();
    if (group) return group.name;
    if (this.productService.featuredOnly()) return 'Featured Collections';
    return 'All Products';
  });

  headerDescription = computed(() => {
    const sub = this.activeSub();
    if (sub && sub.description) return sub.description;
    const group = this.activeGroup();
    if (group) return group.description;
    if (this.productService.featuredOnly()) {
      return 'Signature and limited-edition handcrafted wood pieces selected for distinct grain figure and master craftsmanship.';
    }
    return 'Handturned objects shaped from selected seasoned hardwoods. Each form is individually balanced and sealed with food-safe finishes.';
  });

  ngOnInit() {
    this.productService.loadProducts().subscribe();

    // Read query params for category, subCategory, featured, search
    this.route.queryParams.subscribe(params => {
      const cat = params['category'] || 'all';
      const sub = params['subCategory'] || 'all';
      const featured = params['featured'] === 'true';
      const q = params['q'] || '';

      this.productService.setCategory(cat, sub);
      this.productService.setFeaturedOnly(featured);
      if (q) {
        this.searchInput = q;
        this.productService.setSearch(q);
      }
    });
  }

  ngAfterViewInit() {
    this.initObserver();
  }

  private initObserver() {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.05 }
    );
    this.el.nativeElement.querySelectorAll('.reveal, .reveal-scale')
      .forEach((el: Element) => observer.observe(el));
  }

  selectMainCategory(catSlug: string) {
    this.productService.setCategory(catSlug, 'all');
    this.productService.setFeaturedOnly(false);
    this.updateQueryParams({ category: catSlug !== 'all' ? catSlug : null, subCategory: null, featured: null });
  }

  selectSubCategory(subSlug: string) {
    this.productService.setSubCategory(subSlug);
    this.updateQueryParams({ subCategory: subSlug !== 'all' ? subSlug : null });
  }

  toggleFeatured() {
    const nextVal = !this.productService.featuredOnly();
    this.productService.setFeaturedOnly(nextVal);
    this.updateQueryParams({ featured: nextVal ? 'true' : null });
  }

  onSortChange() {
    this.productService.setSort(this.selectedSort);
  }

  onSearch() {
    this.productService.setSearch(this.searchInput);
  }

  clearSearch() {
    this.searchInput = '';
    this.productService.setSearch('');
    this.updateQueryParams({ q: null });
  }

  clearFilters() {
    this.searchInput = '';
    this.selectedSort = 'default';
    this.productService.clearFilters();
    this.router.navigate(['/shop'], { queryParams: {} });
  }

  private updateQueryParams(params: Record<string, string | null>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }
}
