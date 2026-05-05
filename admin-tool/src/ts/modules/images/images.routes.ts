import { Routes } from '@angular/router';
import { ImagesHeaderComponent } from './images-header/images-header.component';
import { ImagesIconsComponent } from './images-icons/images-icons.component';

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
    ],
  },
];
