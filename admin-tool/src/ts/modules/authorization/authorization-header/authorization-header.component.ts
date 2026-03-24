import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'authorization-header',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './authorization-header.component.html',
  styleUrl: './authorization-header.component.less',
})
export class AuthorizationHeaderComponent {}
