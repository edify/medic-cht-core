import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { 
  DeployInfo, 
  Build, 
  VersionGroups, 
  IndexingDifference, 
  UpgradeDoc, 
  IndexerProgress 
} from '@admin-tool-modules/upgrade/upgrade-interfaces';
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
   * Fetches the current upgrade state from the CHT instance.
   * Returns the builds database URL, the in-progress upgrade document if any,
   * and the current indexer progress array.
   * If the request fails or any field is missing, returns safe defaults —
   * the default builds URL, null upgradeDoc and empty indexers array.
   *
   * @returns {Promise<{ buildsUrl: string; upgradeDoc: UpgradeDoc | null; indexers: IndexerProgress[] }>}
   */
  async getCurrentUpgrade(): Promise<{ 
    buildsUrl: string; 
    upgradeDoc: UpgradeDoc | null; 
    indexers: IndexerProgress[] 
  }> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ buildsUrl?: string; upgradeDoc?: UpgradeDoc; indexers?: IndexerProgress[] }>(`${UPGRADE_URL}`)
      );
      return {
        buildsUrl: response.buildsUrl ?? DEFAULT_BUILDS_URL,
        upgradeDoc: response.upgradeDoc ?? null,
        indexers: response.indexers ?? [],
      };
    } catch (error) {
      console.error('Error fetching current upgrade state', error);
      return {
        buildsUrl: DEFAULT_BUILDS_URL,
        upgradeDoc: null,
        indexers: [],
      };
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
   * Delegates to queryBuilds for each type of build.
   *
   * @param {DeployInfo} deployInfo - the currently running deploy information
   * @returns {Promise<VersionGroups>}
   */
  async getBuilds(deployInfo: any): Promise<VersionGroups> {
    const { buildsUrl } = await this.getCurrentUpgrade();
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

  /**
   * Fetches and caches the indexing comparison between the current deploy and the target build.
   * Makes a POST to /api/v2/upgrade/compare and mutates the build object with the result.
   * Sets build.compare to the array of indexing differences returned by the API.
   * Sets build.requiresIndexing to true if any difference has indexing true.
   * If build.compare already exists the request is skipped — acts as a local cache.
   * If the request fails, logs the error and does not propagate — the modal opens without indexing info.
   *
   * @param {Build} build - the build to compare against the current deploy
   * @returns {Promise<void>}
   */
  async compareReleases(build: Build): Promise<void> {
    if (build.compare) {
      return;
    }
    try {
      const differences = await firstValueFrom(
        this.http.post<IndexingDifference[]>(`${UPGRADE_URL}/compare`, { build })
      );
      build.compare = differences;
      build.requiresIndexing = differences.some(difference => difference.indexing);
    } catch (error) {
      console.error('Failed to compare releases', error);
    }
  }

  /**
   * Stages the given build on the CHT instance.
   * Makes a POST to /api/v2/upgrade/stage with the build in the body.
   * Propagates any error to the caller.
   *
   * @param {Build} build - the build to stage
   * @returns {Promise<void>}
   */
  async stage(build: Build): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${UPGRADE_URL}/stage`, { build })
    );
  }

  /**
   * Cancels the in-progress upgrade on the CHT instance.
   * Makes a DELETE to /api/v2/upgrade.
   * Propagates any error to the caller.
   *
   * @returns {Promise<void>}
   */
  async abortUpgrade(): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(UPGRADE_URL)
    );
  }

  /**
   * Completes the installation of a previously staged build.
   * Makes a POST to /api/v2/upgrade/complete with the build in the body.
   * If the request fails with status -1, 502 or 503, the server is restarting —
   * waits for the API to come back up via waitUntilApiStarts before resolving.
   * Propagates any other error to the caller.
   *
   * @param {Build} build - the build to complete installing
   * @returns {Promise<void>}
   */
  async completeInstall(build: Build): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${UPGRADE_URL}/complete`, { build })
      );
    } catch (error: any) {
      const requestFailedStatuses = [-1, 502, 503];
      if (!error.status || requestFailedStatuses.includes(error.status)) {
        await this.waitUntilApiStarts();
        return;
      }
      throw error;
    }
  }

  /**
   * Polls GET /setup/poll every second until the API responds successfully.
   * Used after completeInstall when the server restarts during installation.
   * Resolves when the API comes back up — the caller then reloads the page.
   *
   * @returns {Promise<void>}
   */
  private async waitUntilApiStarts(): Promise<void> {
    return new Promise((resolve) => {
      const pollApi = async () => {
        try {
          await firstValueFrom(this.http.get('/setup/poll'));
          resolve();
        } catch {
          setTimeout(pollApi, 1000);
        }
      };
      pollApi();
    });
  }

  /**
   * Installs the given build directly on the CHT instance without a prior stage.
   * Makes a POST to /api/v2/upgrade with the build in the body.
   * Propagates any error to the caller.
   *
   * @param {Build} build - the build to install
   * @returns {Promise<void>}
   */
  async install(build: Build): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(UPGRADE_URL, { build })
    );
  }
}
