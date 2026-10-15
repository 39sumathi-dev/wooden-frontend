import { Component, OnInit, inject, AfterViewInit, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

interface FeaturedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  slug: string;
}

interface CategoryCard {
  name: string;
  count: number;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  productService = inject(ProductService);
  cart = inject(CartService);
  private el = inject(ElementRef);

  activeSlide = signal<number>(1);

  // Featured Collection Products matching the artisan catalogue
  featuredProducts: FeaturedItem[] = [
    {
      id: 'golden-ember-magnolia-bowl',
      name: 'Golden Ember Bowl',
      price: 95,
      image: 'assets/products/golden-ember-bowl.jpg',
      category: 'Magnolia Wood',
      slug: 'golden-ember-magnolia-bowl'
    },
    {
      id: 'emerald-glow-cherry-bowl',
      name: 'Emerald Glow Bowl',
      price: 125,
      image: 'assets/products/emerald-glow-bowl.jpg',
      category: 'Cherry & Iridescent Inlay',
      slug: 'emerald-glow-cherry-bowl'
    },
    {
      id: 'natures-edge-rustic-bowl',
      name: 'Nature’s Edge Live Edge',
      price: 95,
      image: 'assets/products/natures-edge-bowl.jpg',
      category: 'Rustic Natural Bark',
      slug: 'natures-edge-rustic-bowl'
    },
    {
      id: 'woodland-trio-segmented-goblet',
      name: 'Woodland Trio Goblet',
      price: 85,
      image: 'assets/products/woodland-trio-goblet.jpg',
      category: 'Cherry, Pine & Ash',
      slug: 'woodland-trio-segmented-goblet'
    }
  ];

  // 4 Shop by Category Cards matching reference layout
  shopCategories: CategoryCard[] = [
    {
      name: 'Bowls',
      count: 12,
      image: 'assets/products/bowl-oak.png',
      slug: 'bowls-trays'
    },
    {
      name: 'Vases',
      count: 9,
      image: 'assets/products/vase-walnut.png',
      slug: 'finials-hollow-forms'
    },
    {
      name: 'Containers',
      count: 14,
      image: 'assets/products/pen-box-walnut.jpg',
      slug: 'pen-boxes-cases'
    },
    {
      name: 'Lighting',
      count: 6,
      image: 'assets/products/candleholder-teak.png',
      slug: 'kitchen-accessories'
    }
  ];

  ngOnInit() {
    this.productService.loadProducts().subscribe();
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = this.el.nativeElement.querySelectorAll('.reveal');
    elements.forEach((el: Element) => observer.observe(el));
  }

  setSlide(index: number) {
    this.activeSlide.set(index);
  }

  formatPrice(n: number): string {
    return this.productService.formatPrice(n);
  }

  quickAddToCart(item: FeaturedItem, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.cart.addItem(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        images: [item.image],
        category: item.category,
        mainCategory: item.category,
        subCategory: item.category,
        description: item.name
      } as any,
      'Standard Craft Edition',
      item.price
    );
  }
}
