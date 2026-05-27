import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Shared service to manage the sidebar visibility state.
 * Used to communicate between HeaderComponent (toggle button)
 * and SidebarComponent (show/hide).
 */
@Injectable({
  providedIn: 'root',
})
export class SidebarStateService {
  private sidebarOpenSubject = new BehaviorSubject<boolean>(false);

  sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  toggle() {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }

  close() {
    this.sidebarOpenSubject.next(false);
  }
}
