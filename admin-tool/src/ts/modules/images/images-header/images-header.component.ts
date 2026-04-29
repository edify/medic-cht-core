import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Layout component for the Images section of the admin tool.
 * Renders the navigation tabs (Icons, Branding, Partners, Header tabs icons)
 * and the router-outlet where child routes are loaded.
 */
@Component({
  selector: 'images-header',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './images-header.component.html',
  styleUrl: './images-header.component.less'
})
export class ImagesHeaderComponent {

}
