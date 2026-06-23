import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@core/authentication/stores/auth.store';

export function roleGuard(requiredRoles: readonly string[]): CanActivateFn {
  return () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (authStore.hasAnyRole(requiredRoles)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
}
