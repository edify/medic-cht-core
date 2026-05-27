import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocationService } from '@admin-tool-services/location.service';

/**
 * Shell header component for the CHT admin tool.
 * Renders the top navigation bar with the application brand name,
 * a link back to the main CHT application, and a log out link.
 * On narrow viewports a hamburger button toggles the nav links.
 */
@Component({
  selector: 'app-header',
  imports: [TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less',
})
export class HeaderComponent {
  webAppUrl = '';
  menuOpen = false;

  constructor(private locationService: LocationService) {
    this.webAppUrl = this.locationService.path;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
