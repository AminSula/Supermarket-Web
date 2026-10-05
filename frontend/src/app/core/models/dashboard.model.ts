export interface DashboardSummary {
  ordersToday: number;
  revenueToday: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface RevenuePoint {
  date: string; 
  revenue: number;
}

export interface OrderStatusCount {
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  count: number;
}