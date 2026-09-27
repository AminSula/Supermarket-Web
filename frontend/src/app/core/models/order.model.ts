export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number; // used to cap quantity adjustments client-side
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderCreateRequest {
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'CASH_ON_DELIVERY';
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
}