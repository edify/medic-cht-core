import { Routes } from '@angular/router';
import { SmsComponent } from './sms.component';
import { SmsSettingsComponent } from './sms-settings/sms-settings.component';
import { SmsFormsComponent } from './sms-forms/sms-forms.component';
import { SmsTestComponent } from './sms-test/sms-test.component';

/**
 * Routes for the SMS module.
 *
 * Defaults to the settings tab on load.
 * Child routes:
 *   - /sms/settings - configure SMS settings
 *   - /sms/forms - manage SMS forms
 *   - /sms/test - send a test SMS
 */
export const routes: Routes = [
  {
    path: 'sms',
    component: SmsComponent,
    children: [
      { path: '', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'settings', component: SmsSettingsComponent },
      { path: 'forms', component: SmsFormsComponent },
      { path: 'test', component: SmsTestComponent },
    ],
  },
];
