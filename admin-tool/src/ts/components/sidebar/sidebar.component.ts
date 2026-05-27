import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthDirective } from '@admin-tool-directives/auth.directive';
import { SidebarStateService } from '@admin-tool-services/sidebar-state.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AuthDirective, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.less',
})
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  private subscription!: Subscription;

  constructor(private sidebarStateService: SidebarStateService) {}

  ngOnInit() {
    this.subscription = this.sidebarStateService.sidebarOpen$.subscribe(
      open => (this.isOpen = open)
    );
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
