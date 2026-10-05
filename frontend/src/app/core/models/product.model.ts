export const MAX_PRODUCT_IMAGES = 5;

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
  hasImage: boolean;
  imageIds: number[];
  hasOrders: boolean;
  createdAt: string;
  updatedAt: string;
}

// Public storefront shape 
export interface ProductPublicResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName: string;
  hasImage: boolean;
  imageIds: number[];
}

export interface ProductDeleteResponse {
  archived: boolean;
}