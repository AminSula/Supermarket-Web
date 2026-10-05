import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginCall = req.url.includes('/api/auth/login');

      if (error.status === 401 && token && !isLoginCall && authService.isLoggedIn()) {
        authService.logout();

        if (router.url.startsWith('/admin') && !router.url.startsWith('/admin/login')) {
          router.navigate(['/admin/login'], {
            queryParams: { returnUrl: router.url, sessionExpired: 1 },
          });
        }
      }

      return throwError(() => error);
    }),
  );
};