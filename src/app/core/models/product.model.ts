// Product variant — dimensions + price options
export interface Variant {
  label?: string;    // e.g. "Small", "Medium", "Large"
  type?: string;     // legacy field (backward compat)
  price: number;
  dimensions?: string;  // e.g. "30cm × 12cm"
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  image?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  subCategories: SubCategory[];
  count?: number;
}

// Full product as returned by FastAPI /products endpoint
export interface Product {
  _id?: string;             // MongoDB ObjectId (string after serialization)
  id: string;               // slug-style identifier e.g. "walnut-bowl"
  name: string;
  parentCategory?: string;  // e.g. "Functional Homeware"
  subCategory?: string;     // e.g. "Bowls & Trays"
  mainCategory?: string;    // e.g. "Functional Homeware"
  mainCategorySlug?: string;
  subCategorySlug?: string;
  category?: string;        // legacy single category field
  timber?: string;          // e.g. "American White Oak", "Teak", "Rosewood"
  description: string;
  images: string[];
  price?: number;           // base price (if set directly)
  variants?: Variant[];
  displayOrder?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  badge?: string;           // e.g. "New", "Bestseller", "Gallery Piece"
}

// Cart item
export interface CartItem {
  product: Product;
  variantLabel: string;  // which variant selected
  price: number;         // price of that variant
  quantity: number;
}

// Flat Product category
export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  count?: number;
  parentSlug?: string;
  subCategories?: SubCategory[];
}

// Review (from /reviews endpoint)
export interface Review {
  _id?: string;
  product_id: string;
  name: string;
  rating: number;       // 1–5
  comment: string;
  images?: string[];
  created_at?: string;
}
