import { Routes } from '@angular/router';
import { SmsComponent } from './sms.component';
import { SmsSettingsComponent } from './sms-settings/sms-settings.component';

/**
 * Routes for the SMS module.
 *
 * Defaults to the settings tab on load.
 * Child routes:
 *   - /sms/settings - configure SMS settings
 */
export const routes: Routes = [
  {
    path: 'sms',
    component: SmsComponent,
    children: [
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        component: SmsSettingsComponent,
      },
    ],
  },
];
