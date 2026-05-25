import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocationService } from '@admin-tool-services/location.service';

/**
 * Shell header component for the CHT admin tool.
 * Renders the top navigation bar with the application brand name,
 * a link back to the main CHT application, and a log out link.
 */
@Component({
  selector: 'app-header',
  imports: [TranslatePipe],
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  /** URL of the main CHT application, used for the Application link in the header */
  webAppUrl = '';

  constructor(private locationService: LocationService){
    this.webAppUrl = this.locationService.path;
  }
}
