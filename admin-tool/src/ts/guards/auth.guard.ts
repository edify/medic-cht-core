import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@admin-tool-services/auth.service';

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
