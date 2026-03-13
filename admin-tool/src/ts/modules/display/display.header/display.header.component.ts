import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'display.header',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './display.header.component.html',
  styleUrl: './display.header.component.less'
})
export class DisplayHeaderComponent {

}
