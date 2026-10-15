import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API_BASE = 'http://localhost:8000';

export interface AdminProduct {
  id?: string;
  name: string;
  mainCategory: string;
  subCategory: string;
  parentCategory?: string;
  category?: string;
  timber?: string;
  description: string;
  images: string[];
  price?: number;
  variants?: { label: string; price: number; dimensions?: string }[];
  displayOrder?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  badge?: string;
}

export interface AdminOrder {
  id: string;
  items: Array<{
    productId: string;
    productName: string;
    variantLabel: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryNotes?: string;
  };
  paymentMethod: string;
  subtotal: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  timeline?: Array<{
    step: string;
    label: string;
    time: string;
    completed: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  currentUser = signal<string | null>(localStorage.getItem('skw_admin_user'));
  token = signal<string | null>(localStorage.getItem('skw_admin_token'));
  isAuthenticated = signal<boolean>(!!localStorage.getItem('skw_admin_token'));

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${API_BASE}/api/admin/login`, { username, password }).pipe(
      tap(res => {
        if (res.status === 'success') {
          this.token.set(res.token);
          this.currentUser.set(res.username);
          this.isAuthenticated.set(true);
          localStorage.setItem('skw_admin_token', res.token);
          localStorage.setItem('skw_admin_user', res.username);
        }
      })
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('skw_admin_token');
    localStorage.removeItem('skw_admin_user');
  }

  getProducts(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(`${API_BASE}/products`);
  }

  saveProduct(product: AdminProduct): Observable<any> {
    if (product.id) {
      return this.http.put(`${API_BASE}/api/products/${product.id}`, product);
    } else {
      return this.http.post(`${API_BASE}/api/products`, product);
    }
  }

  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(`${API_BASE}/api/products/${productId}`);
  }

  uploadImage(file: File): Observable<{ status: string; url: string; filename: string; provider: string; stats?: any; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ status: string; url: string; filename: string; provider: string; stats?: any; message?: string }>(
      `${API_BASE}/api/upload`,
      formData
    );
  }

  getOrders(): Observable<{ status: string; count: number; orders: AdminOrder[] }> {
    return this.http.get<{ status: string; count: number; orders: AdminOrder[] }>(`${API_BASE}/api/admin/orders`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(`${API_BASE}/api/admin/orders/${orderId}/status`, { status });
  }
}
