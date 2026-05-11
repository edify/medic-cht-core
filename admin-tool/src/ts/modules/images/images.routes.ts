import { Routes } from '@angular/router';
import { ImagesHeaderComponent } from './images-header/images-header.component';
import { ImagesIconsComponent } from './images-icons/images-icons.component';
import { ImagesBrandingComponent } from './images-branding/images-branding.component';

/**
 * Routes for the Images module.
 * Child routes:
 *   - /images/icons - manage resource icons
 *   - /images/branding - configure application branding
 *   - /images/partners - manage partner logos
 *   - /images/header-tabs-icons - manage header tab icons
 */
export const routes: Routes = [
  {
    path: 'images',
    component: ImagesHeaderComponent,
    children: [
      {
        path: '',
        redirectTo: 'icons',
        pathMatch: 'full',
      },
      {
        path: 'icons',
        component: ImagesIconsComponent,
      },
      {
        path: 'branding',
        component: ImagesBrandingComponent,
      },
    ],
  },
];
