import { Routes } from '@angular/router';
import { UpgradeComponent } from './upgrade/upgrade.component';

/**
 * Routes for the Upgrade module.
 * Child routes:
 *   - /upgrade - manage CHT instance upgrades
 */
export const routes: Routes = [
  {
    path: 'upgrade',
    component: UpgradeComponent,
  },
];
