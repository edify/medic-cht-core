import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DeployInfo } from '@admin-tool-modules/upgrade/upgrade-interfaces';

const UPGRADE_URL = '/api/v2/upgrade';

/**
 * Service responsible for reading upgrade information and managing
 * upgrade operations for the CHT instance.
 *
 * Communicates with the CHT REST API via HttpClient.
 * All upgrade-related endpoints are prefixed with UPGRADE_URL.
 */
@Injectable({
  providedIn: 'root'
})
export class UpgradeService {

  constructor(private http: HttpClient){}

  /**
   * Fetches the deployment information of the currently running CHT instance.
   * Propagates any error to the caller, the component is responsible for handling it.
   *
   * @returns {Promise<DeployInfo>}
   */
  async getDeployInfo(): Promise<DeployInfo> {
    const deployInfo = firstValueFrom(this.http.get<DeployInfo>('/api/deploy-info'));
    return deployInfo;
  }

  /**
   * Checks whether the CHT instance is currently able to receive an upgrade.
   * If the request fails, logs the error and returns false as a safe default
   * instead of propagating, this error should never block the page from loading.
   *
   * @returns {Promise<boolean>}
   */
  async getCanUpgrade(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ ok: boolean }>(`${UPGRADE_URL}/can-upgrade`)
      );
      return response.ok;
    } catch (error) {
      console.error('Error when checking if upgrades are possible', error);
      return false;
    }
  }
}
