import { Component, OnInit } from '@angular/core';
import { NewRole, Role, RolesMap, RoleValidation } from '../authorization-interfaces';
import { ResponseStatus } from '../../global-modules-interfaces';
import { SettingsService } from '@admin-tool-services/settings.service';
import { FormsModule } from '@angular/forms';

/**
 * Component for managing the roles configured in the CHT instance.
 *
 * Loads settings.roles on init and displays them in a table.
 * Allows administrators to add new roles and delete existing ones.
 *
 * Part of the Authorization module — requires the can_configure permission.
 */
@Component({
  selector: 'authorization-roles',
  imports: [FormsModule],
  templateUrl: './authorization-roles.component.html',
  styleUrl: './authorization-roles.component.less',
})
export class AuthorizationRolesComponent implements OnInit {
  /** List of roles mapped from settings.roles for template iteration */
  roles: { key: string; value: Role }[] = [];

  /** Controls visibility of the loader while settings are being fetched */
  loadingPageStatus = false;

  /** Tracks the state of save operations for add and delete actions */
  responseStatus: ResponseStatus = {};

  newRole: NewRole = {};
  roleValidation: RoleValidation = {};
  isAddingRole = false;

  constructor(private settingsService: SettingsService) {}

  /**
   * Fetches settings.roles on init and maps the result into an array
   * of { key, value } pairs for use in the template @for loop.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;

    try {
      const rolesMap = await this.settingsService.getRoles();
      this.roles = Object.entries(rolesMap).map(([key, value]) => ({ key, value }));
    } catch (error) {
      console.error('Error fetching roles', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  private validateRole(): boolean {
    this.roleValidation = {};

    // TODO: implement translation for error messages
    if (!this.newRole.key) {
      this.roleValidation.key = 'field is required';
    }

    if (!this.newRole.name) {
      this.roleValidation.name = 'field is required';
    }

    return !Object.keys(this.roleValidation).length;
  }
  
  async addRole(): Promise<void> {
    this.isAddingRole = true;
    this.responseStatus = {};

    if (!this.validateRole()) {
      return;
    }

    this.responseStatus = { state: 'loading' };

    const changes: RolesMap = {};
    this.roles.forEach((role) => {
      changes[role.key] = role.value;
    });

    changes[this.newRole.key!] = {
      name: this.newRole.name!,
      offline: this.newRole.offline,
    };

    try{
      await this.settingsService.updateRoles(changes);
      this.roles = Object.entries(changes).map(([key, value]) => ({ key, value }));
      this.newRole = {};
      this.responseStatus = {};
    } catch (error) {
      console.error('Error saving role', error);
      this.responseStatus = { state: 'error', msg: 'Error saving settings' };
    } finally {
      this.isAddingRole = false;
    }
  }

  async deleteRole(key: string): Promise<void> {
    this.responseStatus = { state: 'loading' };

    const changes: RolesMap = {};
    this.roles.forEach((role) => {
      if (role.key !== key) {
        changes[role.key] = role.value;
      }
    });

    try {
      await this.settingsService.updateRoles(changes);
      this.roles = Object.entries(changes).map(([key, value]) => ({ key, value }));
      this.responseStatus = {};
    } catch (error) {
      console.error('Error deleting role', error);
      this.responseStatus = { state: 'error', msg: 'Error saving settings' };
    }
  }
}
