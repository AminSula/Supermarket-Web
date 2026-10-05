import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protects the whole admin area. A visitor who isn't logged in is sent to the login
// page, remembering where they were headed so login can bring them back.
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};

// For the login page itself: an owner who is already logged in has no reason to see it.
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn() ? router.createUrlTree(['/admin/dashboard']) : true;
};