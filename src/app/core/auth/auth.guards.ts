import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from './auth.models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.parseUrl('/');
};

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as UserRole[] | undefined;

  if (!auth.isAuthenticated()) return router.parseUrl('/');
  if (roles?.length && !roles.some(role => auth.hasRole(role))) {
    return router.parseUrl(auth.homePath());
  }

  return true;
};
