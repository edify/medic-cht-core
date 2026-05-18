import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DeployInfo, Build, VersionGroups } from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { VersionService } from '@admin-tool-services/version.service';

const UPGRADE_URL = '/api/v2/upgrade';
const DEFAULT_BUILDS_URL = 'https://staging.dev.medicmobile.org/_couch/builds_4';

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

  constructor(
    private http: HttpClient,
    private versionService: VersionService,
  ){}

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
  
  /**
   * Fetches the builds database URL configured for this CHT instance.
   * Returns the default builds DB URL if the request fails or the response
   * does not include a buildsUrl.
   *
   * @returns {Promise<string>} the builds database URL
   */
  async getCurrentUpgrade(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ buildsUrl?: string }>(`${UPGRADE_URL}`)
      );
      return response.buildsUrl ?? DEFAULT_BUILDS_URL;
    } catch (error) {
      console.error('Error fetching current upgrade state', error);
      return DEFAULT_BUILDS_URL;
    }
  }

  /**
   * Queries the builds database for a specific type of build.
   * Applies a version fallback for old builds that do not include version in their value,
   * extracting it from the document id instead.
   *
   * @param {any} buildsDb - the PouchDB instance connected to the builds database
   * @param {any[]} startkey - the CouchDB view startkey for this query
   * @param {any[]} endkey - the CouchDB view endkey for this query
   * @returns {Promise<Build[]>}
   */
  private async queryBuilds(buildsDb: any, startkey: any[], endkey: any[]): Promise<Build[]> {
    const result = await buildsDb.query('builds/releases', {
      startkey,
      endkey,
      descending: true,
      limit: 50,
    });
    return result.rows.map((row: any) => {
      if (!row.value.version) {
        row.value.version = row.id.replace(/^medic:medic:/, '');
      }
      return row.value as Build;
    });
  }

  /**
   * Fetches available builds from the external builds database grouped by type.
   * Connects directly to the builds DB via PouchDB using the URL returned by getCurrentUpgrade.
   * Queries releases, betas and branches sequentially. Feature releases are only
   * queried when the current deploy is running a Feature Release version.
   *
   * @param {DeployInfo} deployInfo - the currently running deploy information
   * @returns {Promise<VersionGroups>}
   */
  async getBuilds(deployInfo: any): Promise<VersionGroups> {
    const buildsUrl = await this.getCurrentUpgrade();
    const buildsDb = new window.PouchDB(buildsUrl);

    const minVersion = this.versionService.minimumNextRelease(deployInfo.version);

    const currentParsed = this.versionService.parse(deployInfo.version);
    const isFeatureRelease = !!currentParsed?.featureRelease;

    const releases = await this.queryBuilds(
      buildsDb,
      ['release', 'medic', 'medic', {}],
      ['release', 'medic', 'medic', minVersion.major, minVersion.minor, minVersion.patch],
    );

    const betas = await this.queryBuilds(
      buildsDb,
      ['beta', 'medic', 'medic', {}],
      ['beta', 'medic', 'medic', minVersion.major, minVersion.minor, minVersion.patch, minVersion.beta],
    );

    const branches = await this.queryBuilds(
      buildsDb,
      ['branch', 'medic', 'medic', {}],
      ['branch', 'medic', 'medic'],
    );

    let featureReleases: Build[] = [];
    if (isFeatureRelease) {
      featureReleases = await this.queryBuilds(
        buildsDb,
        [minVersion.featureRelease, 'medic', 'medic', {}],
        [
          minVersion.featureRelease,
          'medic',
          'medic',
          minVersion.major,
          minVersion.minor,
          minVersion.patch,
          minVersion.beta,
        ],
      );
    }
    return { branches, betas, releases, featureReleases };
  }
}
