import { Routes } from '@angular/router';
import { AuthorizationHeaderComponent } from './authorization-header/authorization-header.component';
import { AuthorizationRolesComponent } from './authorization-roles/authorization-roles.component';
import { authGuard } from 'src/ts/guards/auth.guard';

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
