import { Routes } from '@angular/router';
import { AuthorizationHeaderComponent } from './authorization-header/authorization-header.component';
import { AuthorizationRolesComponent } from './authorization-roles/authorization-roles.component';
import { authGuard } from 'src/ts/guards/auth.guard';

/**
 * Routes for the Authorization module.
 * All routes are protected by the authGuard — users without the
 * can_configure permission are redirected to /.
 *
 * Defaults to the permissions tab on load.
 * Child routes:
 *   - /authorization/permissions - manage role permissions
 *   - /authorization/roles - manage system roles
 */
export const routes: Routes = [
  {
    path: 'authorization',
    component: AuthorizationHeaderComponent,
    canActivate: [() => authGuard('can_configure')],
    children: [
      {
        path: '',
        redirectTo: 'permissions',
        pathMatch: 'full',
      },
      {
        path: 'roles',
        component: AuthorizationRolesComponent,
      },
    ],
  },
];
