import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminProduct, AdminOrder } from '../../core/services/admin.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
// SK Wood Turnery Admin Console
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  productService = inject(ProductService);

  // Tabs
  activeTab = signal<'products' | 'orders' | 'storage'>('products');

  // Auth form
  loginUsername = 'admin';
  loginPassword = '';
  loginError = signal<string | null>(null);
  loginLoading = signal<boolean>(false);

  // Products state
  products = signal<AdminProduct[]>([]);
  loadingProducts = signal<boolean>(false);
  productSearch = signal<string>('');
  categoryFilter = signal<string>('all');

  // Product modal / editor state
  showProductModal = signal<boolean>(false);
  isNewProduct = signal<boolean>(false);
  editingProduct: AdminProduct = this.createEmptyProduct();
  saveLoading = signal<boolean>(false);
  saveError = signal<string | null>(null);

  // Image upload state
  uploadLoading = signal<boolean>(false);
  uploadStatus = signal<string | null>(null);

  // Orders state
  orders = signal<AdminOrder[]>([]);
  loadingOrders = signal<boolean>(false);
  orderStatusFilter = signal<string>('all');

  // Notifications
  toastMessage = signal<string | null>(null);

  // Direct R2 tester state
  testerUploadLoading = signal<boolean>(false);
  testerUploadedUrl = signal<string | null>(null);
  testerUploadedFilename = signal<string | null>(null);
  testerUploadStats = signal<any>(null);
  manualImageUrl = '';

  // Taxonomy options
  mainCategories = [
    'Functional Homeware',
    'Fine Writing Instruments & Gifts',
    'Art & Accent Pieces'
  ];

  subCategoryMap: Record<string, string[]> = {
    'Functional Homeware': [
      'Bowls & Trays',
      'Goblets & Drinkware',
      'Kitchen Accessories (Bottle Stoppers, ...)'
    ],
    'Fine Writing Instruments & Gifts': [
      'Executive Pens & Sets',
      'Wooden Pen Boxes & Cases',
      'Custom Ring Boxes'
    ],
    'Art & Accent Pieces': [
      'Finials & Hollow Forms',
      'Spinning Tops & Desk Curios',
      'Specialty / Hybrid Pieces (Resin & Pearl)'
    ]
  };

  get featuredCount(): number {
    return this.products().filter(p => p.isFeatured).length;
  }

  get timbersCount(): number {
    const timbers = new Set(this.products().map(p => p.timber).filter(Boolean));
    return timbers.size;
  }

  ngOnInit() {
    if (this.adminService.isAuthenticated()) {
      this.loadProducts();
      this.loadOrders();
    }
  }

  // --- AUTHENTICATION ---
  onLogin() {
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError.set('Please provide both username and password.');
      return;
    }

    this.loginLoading.set(true);
    this.loginError.set(null);

    this.adminService.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        this.loginLoading.set(false);
        this.showToast('Welcome to SK Wood Turnery Admin Control Panel');
        this.loadProducts();
        this.loadOrders();
      },
      error: (err) => {
        this.loginLoading.set(false);
        this.loginError.set(err.error?.detail || 'Invalid username or password.');
      }
    });
  }

  onLogout() {
    this.adminService.logout();
    this.showToast('You have been logged out.');
  }

  // --- PRODUCTS ---
  loadProducts() {
    this.loadingProducts.set(true);
    this.adminService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
        this.showToast('Failed to load products from MongoDB Atlas');
      }
    });
  }

  get filteredProducts(): AdminProduct[] {
    let list = this.products();
    const q = this.productSearch().toLowerCase().trim();
    const cat = this.categoryFilter();

    if (cat !== 'all') {
      list = list.filter(p => p.mainCategory === cat);
    }

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.timber && p.timber.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }

    return list;
  }

  createEmptyProduct(): AdminProduct {
    return {
      name: '',
      mainCategory: 'Functional Homeware',
      subCategory: 'Bowls & Trays',
      parentCategory: 'Functional Homeware',
      timber: 'American White Oak',
      description: '',
      images: [],
      price: 1299,
      variants: [{ label: 'Standard 20cm', price: 1299, dimensions: '20cm × 8cm' }],
      isFeatured: false,
      isNew: false,
      badge: ''
    };
  }

  openCreateModal() {
    this.editingProduct = this.createEmptyProduct();
    this.isNewProduct.set(true);
    this.saveError.set(null);
    this.showProductModal.set(true);
  }

  openEditModal(product: AdminProduct) {
    this.editingProduct = JSON.parse(JSON.stringify(product));
    if (!this.editingProduct.variants) {
      this.editingProduct.variants = [];
    }
    if (!this.editingProduct.images) {
      this.editingProduct.images = [];
    }
    this.isNewProduct.set(false);
    this.saveError.set(null);
    this.showProductModal.set(true);
  }

  closeModal() {
    this.showProductModal.set(false);
  }

  onMainCategoryChange() {
    const subcats = this.subCategoryMap[this.editingProduct.mainCategory] || [];
    if (subcats.length > 0) {
      this.editingProduct.subCategory = subcats[0];
    }
    this.editingProduct.parentCategory = this.editingProduct.mainCategory;
  }

  // --- CLOUDFLARE R2 IMAGE UPLOAD ---
  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const isValid = validTypes.includes(file.type) || validExts.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      this.showToast('Please upload a JPEG or JPG product photograph.');
      input.value = '';
      return;
    }

    this.uploadLoading.set(true);
    this.uploadStatus.set(`Compressing & uploading ${file.name} to Cloudflare R2...`);

    this.adminService.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadLoading.set(false);
        const reductionText = res.stats?.reductionPercent ? ` (${res.stats.reductionPercent}% compressed)` : '';
        this.uploadStatus.set(`Uploaded to Cloudflare R2${reductionText}!`);
        if (!this.editingProduct.images) {
          this.editingProduct.images = [];
        }
        this.editingProduct.images.push(res.url);
        this.showToast(`Compressed & uploaded to Cloudflare R2: ${res.filename}`);
        input.value = '';
      },
      error: (err) => {
        this.uploadLoading.set(false);
        this.uploadStatus.set(`Upload error: ${err.error?.detail || err.message || 'Failed'}`);
        this.showToast('Failed to upload image to Cloudflare R2');
      }
    });
  }

  addManualImage() {
    if (!this.manualImageUrl.trim()) return;
    if (!this.editingProduct.images) {
      this.editingProduct.images = [];
    }
    this.editingProduct.images.push(this.manualImageUrl.trim());
    this.manualImageUrl = '';
    this.showToast('Image URL added.');
  }

  removeProductImage(index: number) {
    this.editingProduct.images.splice(index, 1);
  }

  onTesterImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const lowerName = file.name.toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!file.type.startsWith('image/') && !validExts.some(ext => lowerName.endsWith(ext))) {
      this.showToast('Please select a valid JPEG or JPG image.');
      input.value = '';
      return;
    }

    this.testerUploadLoading.set(true);
    this.testerUploadStats.set(null);

    this.adminService.uploadImage(file).subscribe({
      next: (res) => {
        this.testerUploadLoading.set(false);
        this.testerUploadedUrl.set(res.url);
        this.testerUploadedFilename.set(res.filename);
        this.testerUploadStats.set(res.stats || null);
        const reductionText = res.stats?.reductionPercent ? ` (compressed by ${res.stats.reductionPercent}%)` : '';
        this.showToast(`Uploaded ${res.filename} to Cloudflare R2${reductionText}!`);
        input.value = '';
      },
      error: (err) => {
        this.testerUploadLoading.set(false);
        this.showToast(err.error?.detail || 'Failed to upload to Cloudflare R2.');
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text);
    this.showToast('Copied URL to clipboard!');
  }

  addVariant() {
    if (!this.editingProduct.variants) {
      this.editingProduct.variants = [];
    }
    this.editingProduct.variants.push({
      label: 'New Size / Variant',
      price: this.editingProduct.price || 1299,
      dimensions: 'Standard'
    });
  }

  removeVariant(index: number) {
    if (this.editingProduct.variants) {
      this.editingProduct.variants.splice(index, 1);
    }
  }

  saveProduct() {
    if (!this.editingProduct.name.trim()) {
      this.saveError.set('Product name is required.');
      return;
    }
    if (!this.editingProduct.description.trim()) {
      this.saveError.set('Product description is required.');
      return;
    }

    this.saveLoading.set(true);
    this.saveError.set(null);

    // Sync primary price with first variant if empty
    if (!this.editingProduct.price && this.editingProduct.variants?.length) {
      this.editingProduct.price = this.editingProduct.variants[0].price;
    }

    this.adminService.saveProduct(this.editingProduct).subscribe({
      next: (res) => {
        this.saveLoading.set(false);
        this.showProductModal.set(false);
        this.showToast(`Product "${this.editingProduct.name}" saved to MongoDB Atlas!`);
        this.loadProducts();
      },
      error: (err) => {
        this.saveLoading.set(false);
        this.saveError.set(err.error?.detail || 'Failed to save product in MongoDB.');
      }
    });
  }

  deleteProduct(product: AdminProduct) {
    if (!product.id) return;
    const confirmed = confirm(`Are you sure you want to permanently delete "${product.name}" from MongoDB Atlas?`);
    if (!confirmed) return;

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => {
        this.showToast(`Deleted "${product.name}" from MongoDB Atlas.`);
        this.loadProducts();
      },
      error: () => {
        this.showToast('Error deleting product from database.');
      }
    });
  }

  // --- ORDERS ---
  loadOrders() {
    this.loadingOrders.set(true);
    this.adminService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.loadingOrders.set(false);
      }
    });
  }

  get filteredOrders(): AdminOrder[] {
    const list = this.orders();
    const filter = this.orderStatusFilter();
    if (filter === 'all') return list;
    return list.filter(o => o.status === filter);
  }

  updateOrderStatus(orderId: string, status: string) {
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.showToast(`Order ${orderId} updated to ${status}.`);
        this.loadOrders();
      },
      error: () => {
        this.showToast('Failed to update order status.');
      }
    });
  }

  // --- UTILS ---
  formatPrice(n?: number): string {
    if (!n) return '$0';
    return this.productService.formatPrice(n);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}
