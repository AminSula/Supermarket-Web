import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

// Three separate "shells" (layouts) so buyers never download any
// admin code and the owner never sees the storefront header or cart:
//
//   /admin/login     -> AuthLayout        (bare page, just the login card)
//   /admin/**        -> AdminLayout       (sidebar + topbar, owner only)
//   everything else  -> StorefrontLayout  (store header + footer, for buyers)
export const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/login/login').then((m) => m.LoginComponent),
          },
        ],
      },
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/dashboard').then((m) => m.DashboardComponent),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./features/admin/products/product-list/product-list').then(
                (m) => m.ProductListComponent,
              ),
          },
          {
            path: 'products/new',
            loadComponent: () =>
              import('./features/admin/products/product-form/product-form').then(
                (m) => m.ProductFormComponent,
              ),
          },
          {
            path: 'products/:id/edit',
            loadComponent: () =>
              import('./features/admin/products/product-form/product-form').then(
                (m) => m.ProductFormComponent,
              ),
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./features/admin/categories/category-list').then((m) => m.CategoryListComponent),
          },
          {
            path: 'categories/new',
            loadComponent: () =>
              import('./features/admin/categories/category-form').then((m) => m.CategoryFormComponent),
          },
          {
            path: 'categories/:id/edit',
            loadComponent: () =>
              import('./features/admin/categories/category-form').then((m) => m.CategoryFormComponent),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/admin/orders/order-list').then((m) => m.OrderListComponent),
          },
        ],
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/storefront-layout/storefront-layout').then((m) => m.StorefrontLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
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
        loadComponent: () => import('./features/cart/cart-page').then((m) => m.CartPageComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout-page').then((m) => m.CheckoutPageComponent),
      },
    ],
  },
  // Anything unknown goes back to the store.
  { path: '**', redirectTo: '' },
];