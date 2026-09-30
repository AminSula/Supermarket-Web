import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/catalog-page').then((m) => m.CatalogPageComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart-page').then((m) => m.CartPageComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout-page').then((m) => m.CheckoutPageComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'admin/products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/products/product-list/product-list').then((m) => m.ProductListComponent),
  },
  {
    path: 'admin/products/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/products/product-form/product-form').then((m) => m.ProductFormComponent),
  },
  {
    path: 'admin/products/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/products/product-form/product-form').then((m) => m.ProductFormComponent),
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/categories/category-list').then((m) => m.CategoryListComponent),
  },
  {
    path: 'admin/categories/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/categories/category-form').then((m) => m.CategoryFormComponent),
  },
  {
    path: 'admin/categories/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/categories/category-form').then((m) => m.CategoryFormComponent),
  },
  {
    path: 'admin/orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/orders/order-list').then((m) => m.OrderListComponent),
  },
];