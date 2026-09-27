export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Public storefront shape — no `active` flag (only active products are
// ever returned publicly), and categoryName is pre-resolved server-side.
export interface ProductPublicResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName: string;
}