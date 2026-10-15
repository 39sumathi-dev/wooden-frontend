import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { Product, Category, CategoryGroup, SubCategory } from '../models/product.model';

// Environment — point to local dev backend or production
const API_BASE = 'http://localhost:8000';

export const CATEGORY_TREE_DATA: CategoryGroup[] = [
  {
    id: 'functional-homeware',
    name: 'Functional Homeware',
    slug: 'functional-homeware',
    description: 'Utilitarian vessels, bowls, and tableware designed to bring tactile woodcraft into daily living.',
    image: 'assets/products/bowl-oak.png',
    subCategories: [
      {
        id: 'bowls-trays',
        name: 'Bowls & Trays',
        slug: 'bowls-trays',
        description: 'Centerpiece salad bowls, platters, and shallow trays carved from seasoned hardwood billets.',
        image: 'assets/products/bowl-oak.png'
      },
      {
        id: 'goblets-drinkware',
        name: 'Goblets & Drinkware',
        slug: 'goblets-drinkware',
        description: 'Turned wooden chalices, wine goblets, and tumblers finished with food-safe natural seals.',
        image: 'assets/products/goblets-teak.jpg'
      },
      {
        id: 'kitchen-accessories',
        name: 'Kitchen Accessories (Bottle Stoppers, ...)',
        slug: 'kitchen-accessories',
        description: 'Precision wine bottle stoppers, salt & pepper mills, and kitchen tools turned from exotic woods.',
        image: 'assets/products/bottle-stoppers.jpg'
      }
    ]
  },
  {
    id: 'fine-writing-gifts',
    name: 'Fine Writing Instruments & Gifts',
    slug: 'fine-writing-gifts',
    description: 'Meticulously turned luxury fountain pens, pen display boxes, and heirloom ring cases.',
    image: 'assets/products/pen-set.png',
    subCategories: [
      {
        id: 'executive-pens',
        name: 'Executive Pens & Sets',
        slug: 'executive-pens',
        description: 'Hand-turned pens made from precious hardwoods with solid German nibs and brass fittings.',
        image: 'assets/products/pen-set.png'
      },
      {
        id: 'pen-boxes-cases',
        name: 'Wooden Pen Boxes & Cases',
        slug: 'pen-boxes-cases',
        description: 'Solid walnut and hardwood desk display cases lined with premium velvet.',
        image: 'assets/products/pen-box-walnut.jpg'
      },
      {
        id: 'custom-ring-boxes',
        name: 'Custom Ring Boxes',
        slug: 'custom-ring-boxes',
        description: 'Heirloom magnetic swivel ring boxes crafted from rich burl wood and rare timbers.',
        image: 'assets/products/ring-box-burl.jpg'
      }
    ]
  },
  {
    id: 'art-accent-pieces',
    name: 'Art & Accent Pieces',
    slug: 'art-accent-pieces',
    description: 'Museum-grade hollow forms, gallery finials, desk curios, and specialty hybrid resin artworks.',
    image: 'assets/products/finial-hollow-form.jpg',
    subCategories: [
      {
        id: 'finials-hollow-forms',
        name: 'Finials & Hollow Forms',
        slug: 'finials-hollow-forms',
        description: 'Delicate thin-walled hollow forms and needle finials turned from contrasting timbers.',
        image: 'assets/products/finial-hollow-form.jpg'
      },
      {
        id: 'spinning-tops-curios',
        name: 'Spinning Tops & Desk Curios',
        slug: 'spinning-tops-curios',
        description: 'Balanced precision wooden spinning tops and sculptural tactile desk artifacts.',
        image: 'assets/products/spinning-tops.jpg'
      },
      {
        id: 'specialty-hybrid-pieces',
        name: 'Specialty / Hybrid Pieces (Resin & Pearl)',
        slug: 'specialty-hybrid-pieces',
        description: 'Striking combination of natural burl timber fused with swirling pearl and emerald epoxy resin.',
        image: 'assets/products/hybrid-resin-bowl.jpg'
      }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  // State signals
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Category filter state
  private _activeCategory = signal<string>('all');       // Main category slug or 'all'
  private _activeSubCategory = signal<string>('all');    // Subcategory slug or 'all'
  private _featuredOnly = signal<boolean>(false);
  private _sortBy = signal<string>('default');
  private _searchQuery = signal<string>('');

  // Public readonly signals
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  activeCategory = this._activeCategory.asReadonly();
  activeSubCategory = this._activeSubCategory.asReadonly();
  featuredOnly = this._featuredOnly.asReadonly();
  sortBy = this._sortBy.asReadonly();
  searchQuery = this._searchQuery.asReadonly();

  // All products from API or fallback
  allProducts = this._products.asReadonly();

  // Category taxonomy tree with dynamic item counts
  categoryTree = computed<CategoryGroup[]>(() => {
    const products = this._products();
    return CATEGORY_TREE_DATA.map(group => {
      const subCategories = group.subCategories.map(sub => {
        const count = products.filter(p =>
          this.matchesMainCategory(p, group.slug) && this.matchesSubCategory(p, sub.slug)
        ).length;
        return { ...sub, count };
      });
      const groupCount = products.filter(p => this.matchesMainCategory(p, group.slug)).length;
      return { ...group, subCategories, count: groupCount };
    });
  });

  // Active Category Group object
  currentCategoryGroup = computed<CategoryGroup | undefined>(() => {
    const slug = this._activeCategory();
    if (slug === 'all') return undefined;
    return this.categoryTree().find(c => c.slug === slug);
  });

  // Active SubCategory object
  currentSubCategory = computed<SubCategory | undefined>(() => {
    const subSlug = this._activeSubCategory();
    if (subSlug === 'all') return undefined;
    for (const group of this.categoryTree()) {
      const found = group.subCategories.find(s => s.slug === subSlug);
      if (found) return found;
    }
    return undefined;
  });

  // Available subcategories for the currently selected category (or all if 'all')
  availableSubCategories = computed<SubCategory[]>(() => {
    const active = this.currentCategoryGroup();
    if (active) return active.subCategories;
    // Flatten all subcategories if on 'all'
    return this.categoryTree().flatMap(g => g.subCategories);
  });

  // Flat categories (for legacy compatibility and simpler grids)
  categories = computed<Category[]>(() => {
    return this.categoryTree().map(g => ({
      slug: g.slug,
      name: g.name,
      description: g.description,
      image: g.image || '',
      count: g.count,
      subCategories: g.subCategories
    }));
  });

  // Filtered and sorted products
  filteredProducts = computed(() => {
    let products = [...this._products()];
    const cat = this._activeCategory();
    const sub = this._activeSubCategory();
    const featOnly = this._featuredOnly();
    const sort = this._sortBy();
    const q = this._searchQuery().toLowerCase().trim();

    // Main category filter
    if (cat !== 'all') {
      products = products.filter(p => this.matchesMainCategory(p, cat));
    }

    // Subcategory filter
    if (sub !== 'all') {
      products = products.filter(p => this.matchesSubCategory(p, sub));
    }

    // Featured filter
    if (featOnly) {
      products = products.filter(p => p.isFeatured);
    }

    // Search filter
    if (q) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.timber && p.timber.toLowerCase().includes(q)) ||
        (p.mainCategory && p.mainCategory.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        (p.parentCategory && p.parentCategory.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sort === 'price-asc') {
      products.sort((a, b) => this.getMinPrice(a) - this.getMinPrice(b));
    } else if (sort === 'price-desc') {
      products.sort((a, b) => this.getMinPrice(b) - this.getMinPrice(a));
    } else if (sort === 'new') {
      products = products.filter(p => p.isNew).concat(products.filter(p => !p.isNew));
    }

    return products;
  });

  // Featured products (for homepage and showcases)
  featuredProducts = computed(() =>
    this._products().filter(p => p.isFeatured).slice(0, 6)
  );

  // Helper matching methods
  private slugify(text?: string): string {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, '-')
      .replace(/[(),.]/g, '')
      .replace(/\//g, '-');
  }

  matchesMainCategory(p: Product, slugOrName: string): boolean {
    if (!slugOrName || slugOrName === 'all') return true;
    const target = this.slugify(slugOrName);
    const mainSlug = this.slugify(p.mainCategory || p.parentCategory || p.category);
    return mainSlug === target || target.includes(mainSlug) || mainSlug.includes(target);
  }

  matchesSubCategory(p: Product, slugOrName: string): boolean {
    if (!slugOrName || slugOrName === 'all') return true;
    const target = this.slugify(slugOrName);
    const subSlug = this.slugify(p.subCategory);
    return subSlug === target || target.includes(subSlug) || subSlug.includes(target);
  }

  // Load all products from backend or fallback
  loadProducts(): Observable<Product[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<Product[]>(`${API_BASE}/products`).pipe(
      tap(products => {
        if (products && products.length > 0) {
          this._products.set(products);
        } else {
          this._products.set(this.fallbackProducts());
        }
        this._loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        console.warn('Backend API unavailable, using handcrafted catalog:', err.message);
        this._products.set(this.fallbackProducts());
        this._loading.set(false);
        return of(this.fallbackProducts());
      })
    );
  }

  // Get single product by slug ID
  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<Product>(`${API_BASE}/products/${id}`).pipe(
      catchError(() => {
        const found = this._products().find(p => p.id === id);
        return of(found);
      })
    );
  }

  // Filter & sort controllers
  setCategory(mainCatSlug: string, subCatSlug?: string) {
    this._activeCategory.set(mainCatSlug);
    this._activeSubCategory.set(subCatSlug || 'all');
  }

  setSubCategory(subCatSlug: string) {
    this._activeSubCategory.set(subCatSlug);
  }

  setFeaturedOnly(featured: boolean) {
    this._featuredOnly.set(featured);
  }

  setSort(sort: string) {
    this._sortBy.set(sort);
  }

  setSearch(q: string) {
    this._searchQuery.set(q);
  }

  clearFilters() {
    this._activeCategory.set('all');
    this._activeSubCategory.set('all');
    this._featuredOnly.set(false);
    this._sortBy.set('default');
    this._searchQuery.set('');
  }

  // Helper: get the minimum variant price for a product
  getMinPrice(product: Product): number {
    if (product.price) return product.price;
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return 0;
  }

  // Helper: format price in USD ($)
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Complete fallback catalogue with the 5 handcrafted woodturnery masterpieces
  private fallbackProducts(): Product[] {
    return [
      {
        id: 'golden-ember-magnolia-bowl',
        name: 'Golden Ember — Handcrafted Magnolia Wood Bowl',
        mainCategory: 'Functional Homeware',
        subCategory: 'Bowls & Trays',
        parentCategory: 'Functional Homeware',
        category: 'Functional Homeware',
        timber: 'Magnolia',
        description: 'Celebrate the natural beauty of magnolia wood with this one-of-a-kind handcrafted bowl. Golden Ember features beautiful honey-gold and amber tones, flowing wood grain, and dramatic dark markings that create a striking contrast across its sculptural form. The generously curved interior, gently flared rim, and organic contours showcase the character of the wood, making this piece a distinctive addition to any home. Perfect as a coffee-table centerpiece, a decorative accent, or a thoughtful gift for a woodcraft enthusiast, this artisan bowl brings warmth, texture, and natural elegance to any setting.\n\nDetails:\n• Wood: Magnolia\n• Color: Honey gold, amber, and rich brown\n• Style: Rustic artisan with natural organic character\n• Design: Rounded body with a wide, gently flared rim\n• Uniqueness: Natural grain and markings make each piece individual\n• Care: Avoid soaking or dishwashing. Confirm the finish is food-safe before using with food.\n\nA distinctive celebration of magnolia wood and its natural beauty.',
        images: ['assets/products/golden-ember-bowl.jpg'],
        price: 95,
        variants: [
          { label: 'Standard Artisan Edition', price: 95, dimensions: '28cm × 11cm' }
        ],
        isFeatured: true,
        isNew: true,
        badge: 'Suggested $95',
        displayOrder: 1
      },
      {
        id: 'emerald-glow-cherry-bowl',
        name: 'Emerald Glow — Handcrafted Cherry Wood Bowl with Iridescent Embellishment',
        mainCategory: 'Functional Homeware',
        subCategory: 'Bowls & Trays',
        parentCategory: 'Functional Homeware',
        category: 'Functional Homeware',
        timber: 'Solid Cherry with Iridescent Embellishment',
        description: 'Beautifully turned from solid cherry wood, this one-of-a-kind artisan bowl showcases the warm honey and amber tones of natural cherry, complemented by distinctive grain patterns and character markings. A striking band of shimmering emerald green, turquoise, and hints of violet embellishment wraps around the exterior, framed by elegant black accent lines.\n\nThe smooth, rounded form, gently flared rim, and carefully finished interior highlight the natural beauty of the wood. The combination of traditional woodturning and vibrant, iridescent detailing creates a captivating piece that blends rustic warmth with contemporary artistic flair. Perfect as a decorative centerpiece, a conversation piece, or a thoughtful gift for someone who appreciates handmade craftsmanship and natural materials.\n\nDetails:\n• Material: Solid cherry wood\n• Design: Hand-turned with iridescent green and turquoise embellishment\n• Accents: Contrasting black decorative bands\n• Finish: Smooth, natural-looking wood finish\n• Style: Contemporary artisan, nature-inspired\n• Uniqueness: One of a kind, with distinctive natural grain and markings\n• Care: Dust with a soft, dry cloth. Avoid soaking, dishwashers, and prolonged exposure to moisture or direct sunlight. Unless the finish and embellishment are confirmed food-safe, use for decorative purposes only.',
        images: ['assets/products/emerald-glow-bowl.jpg'],
        price: 125,
        variants: [
          { label: 'Signature Iridescent Edition', price: 125, dimensions: '26cm × 13cm' }
        ],
        isFeatured: true,
        isNew: true,
        badge: 'Suggested $125',
        displayOrder: 2
      },
      {
        id: 'cherry-glow-bowl',
        name: 'Cherry Glow — Hand-Turned Cherry Bowl',
        mainCategory: 'Functional Homeware',
        subCategory: 'Bowls & Trays',
        parentCategory: 'Functional Homeware',
        category: 'Functional Homeware',
        timber: 'Solid Cherry Wood',
        description: 'Showcasing the natural warmth and rich reddish-brown tones of cherry wood, this hand-turned bowl features beautiful flowing grain, distinctive natural figuring, and a smooth, gently curved profile. Its shallow, elegant shape makes it a lovely centerpiece, decorative accent, or serving bowl. Each piece highlights the unique character of the wood, making it one of a kind.\n\nDetails:\n• Material: Solid cherry wood\n• Finish: Smooth, natural wood finish\n• Care: Hand-wipe with a soft, slightly damp cloth; avoid soaking or the dishwasher. Use for food only if the finish is food-safe.',
        images: ['assets/products/cherry-glow-bowl.jpg'],
        price: 65,
        variants: [
          { label: 'Shallow Profile Edition', price: 65, dimensions: '24cm × 6cm' }
        ],
        isFeatured: true,
        isNew: false,
        badge: 'Suggested $65',
        displayOrder: 3
      },
      {
        id: 'natures-edge-rustic-bowl',
        name: 'Nature’s Edge — Rustic Live Edge Bowl',
        mainCategory: 'Functional Homeware',
        subCategory: 'Bowls & Trays',
        parentCategory: 'Functional Homeware',
        category: 'Functional Homeware',
        timber: 'Natural Wood with Live Bark Edge',
        description: 'Celebrate the beauty of natural wood with this one-of-a-kind live edge bowl. Its organic, irregular rim preserves the character of the original tree, including rugged bark details and contrasting golden wood grain. The rounded form and sculptural silhouette create a striking balance between rustic charm and refined craftsmanship. A distinctive accent for a coffee table, shelf, or nature-inspired interior.\n\nDetails:\n• Material: Natural wood with preserved live edge and bark features\n• Finish: Smoothly finished interior and exterior with natural edge details\n• Care: Keep dry and clean with a soft cloth. Avoid soaking and direct heat.',
        images: ['assets/products/natures-edge-bowl.jpg'],
        price: 95,
        variants: [
          { label: 'Sculptural Live Edge Edition', price: 95, dimensions: '30cm × 14cm' }
        ],
        isFeatured: true,
        isNew: true,
        badge: 'Suggested $95',
        displayOrder: 4
      },
      {
        id: 'woodland-trio-segmented-goblet',
        name: 'Woodland Trio — Segmented Artisan Goblet',
        mainCategory: 'Functional Homeware',
        subCategory: 'Goblets & Drinkware',
        parentCategory: 'Functional Homeware',
        category: 'Functional Homeware',
        timber: 'Cherry, Pine & Ash',
        description: 'A distinctive woodturned goblet handcrafted from three contrasting woods: cherry, pine, and ash. Rich reddish-brown cherry, warm golden pine, and light ash combine to create a beautiful interplay of colors and natural grain patterns. The elongated cup, graceful stem, and sculpted base give this piece an elegant silhouette, making it an eye-catching display piece, a memorable handmade gift, or a unique addition to a woodturning collection.\n\nDetails:\n• Materials: Cherry, pine, and ash\n• Construction: Segmented woodturning\n• Finish: Smooth, polished wood finish\n• Care: Wipe clean with a soft cloth. Not intended for dishwasher use and beverage use.',
        images: ['assets/products/woodland-trio-goblet.jpg'],
        price: 85,
        variants: [
          { label: 'Segmented Artisan Chalice', price: 85, dimensions: '21cm × 8cm' }
        ],
        isFeatured: true,
        isNew: true,
        badge: 'Suggested $85',
        displayOrder: 5
      }
    ];
  }
}
