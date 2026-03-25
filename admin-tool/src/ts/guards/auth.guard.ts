import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@admin-tool-services/auth.service';

/**
 * Route guard that checks whether the current user has the required
 * permission before activating a route.
 *
 * Returns true to allow navigation, or a UrlTree redirecting to '/'
 * if the user lacks the required permission.
 *
 * Usage in routes:
 *   canActivate: [authGuard('can_configure')]
 *
 * @param {string} permission - the permission key to check (e.g. 'can_configure')
 * @returns {CanActivateFn}
 */
export const authGuard = (permission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.has(permission).then((hasPermission) => {
      if (!hasPermission) {
        return router.parseUrl('/');
      }
      return true;
    });
  };
};
