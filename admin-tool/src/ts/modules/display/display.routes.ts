import { Routes } from '@angular/router';
import { DisplayHeaderComponent } from './display.header/display.header.component';
import { DisplayDateTimeComponent } from './display.date.time/display.date.time.component';

export const routes: Routes = [
  {
    path: 'display',
    component: DisplayHeaderComponent,
    children: [
      {
        path: 'date-time',
        component: DisplayDateTimeComponent,
      }
    ]
  },
];
