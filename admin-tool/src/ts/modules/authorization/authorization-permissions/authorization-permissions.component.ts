import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { Component, OnInit } from '@angular/core';
import { PermissionRow, PermissionsMap, RolesMap } from '../authorization-interfaces';
import { SettingsService } from '@admin-tool-services/settings.service';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'authorization-permissions',
  imports: [FormsModule,TranslatePipe],
  templateUrl: './authorization-permissions.component.html',
  styleUrl: './authorization-permissions.component.less'
})
export class AuthorizationPermissionsComponent implements OnInit {

  permissions: PermissionRow[] = [];
  
  loadingPageStatus = false;

  responseStatus: ResponseStatus = {};

  constructor(private settingsService: SettingsService) {}

  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try{
      const rolesMap = await this.settingsService.getRoles();
      const permissionsMap = await this.settingsService.getPermissions();
      this.permissions = this.buildPermissions(rolesMap, permissionsMap);
    } catch (error) {
      console.error('Error fetching permissions', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  private buildPermissions(rolesMap: RolesMap, permissionsMap: PermissionsMap): PermissionRow[] {
    const rolesKeys = Object.keys(rolesMap);
    const permissionsKeys = Object.keys(permissionsMap).sort();

    const permissionsBuilt = permissionsKeys.map( permissionKey => {
      const roles = rolesKeys.map(roleKey => ({
        key: roleKey,
        name: rolesMap[roleKey].name,
        enabled: permissionsMap[permissionKey].includes(roleKey),
      }));

      return {
        key: permissionKey,
        roles,
      };
    });
    
    return permissionsBuilt;
  }

  //TODO: Implement submit
  async submit(){}


}
