import { AuthDirective } from '@admin-tool-directives/auth.directive';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Layout component for the SMS section of the admin tool.
 * Renders the navigation tabs (Settings, Forms, Test) and the router-outlet
 * where child routes are loaded.
 *
 * Access to this component is restricted to users with the can_configure
 * permission, enforced by the authGuard in sms.routes.ts.
 */
@Component({
  selector: 'sms-header',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AuthDirective, TranslatePipe],
  templateUrl: './sms-header.component.html',
  styleUrl: './sms-header.component.less',
})
export class SmsHeaderComponent {}
