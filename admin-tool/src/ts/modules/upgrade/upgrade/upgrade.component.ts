import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { VersionService } from '@admin-tool-services/version.service';
import { 
  DeployInfo, 
  VersionGroups, 
  Build, 
  UpgradeDoc, 
  IndexerProgress 
} from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { UpgradeConfirmComponent } from '@admin-tool-modules/upgrade/upgrade-confirm/upgrade-confirm.component';
import { UpgradeAbortComponent } from '@admin-tool-modules/upgrade/upgrade-abort/upgrade-abort.component';

/**
 * Component for managing CHT instance upgrades.
 *
 * Loads the current deployment information, upgrade availability and available
 * builds on init. Displays the current version details and a list of available
 * releases organized by type — stable releases, betas, branches and feature releases.
 * Builds are loaded from the external builds database via UpgradeService.
 * Further functionality for staging, installing and monitoring upgrade progress
 * will be added in subsequent stories.
 *
 * Part of the Upgrade module.
 */
@Component({
  selector: 'upgrade',
  imports: [TranslatePipe, DatePipe, UpgradeConfirmComponent, UpgradeAbortComponent],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.less'
})
export class UpgradeComponent implements OnInit, OnDestroy {

  /** Deployment information of the currently running CHT instance, null until loaded */
  deployInfo: DeployInfo | null = null;

  /** Whether the CHT instance is currently able to receive an upgrade */
  canUpgrade = false;

  /** Controls visibility of the loader while deployment information is being fetched */
  loadingPageStatus = false;

  /** Translation key for the error message shown when a request fails, null when no error */
  errorKey: string | null = null;

  /** Available builds grouped by type, loaded from the external builds database */
  versionGroups: VersionGroups = {
    releases: [],
    betas: [],
    branches: [],
    featureReleases: [],
  };

  upgradeDoc: UpgradeDoc | null = null;
  indexerProgress: IndexerProgress[] = [];
  upgraded = false;
  showConfirmModal= false;
  showAbortModal= false;
  confirmBuild: Build | null = null;
  confirmStageOnly = false;
  confirmCallback: (() => Promise<void>) | null = null;
  private pollingTimeout: ReturnType<typeof setTimeout> | null = null;
  abortCallback: (() => Promise<void>) | null = null;
  
  constructor(
    private upgradeService: UpgradeService,
    private versionService: VersionService,
  ){}

  /**
   * Fetches the current deployment information, upgrade availability and available
   * builds from the external builds database on init.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.deployInfo = await this.upgradeService.getDeployInfo();
      this.canUpgrade = await this.upgradeService.getCanUpgrade();
      await this.loadCurrentUpgrade();
      if (!this.upgradeDoc) {
        this.versionGroups = await this.upgradeService.getBuilds(this.deployInfo!)
          .catch((error) => {
            console.error('Error fetching builds', error);
            this.errorKey = 'instance.upgrade.error.version_fetch';
            return { releases: [], betas: [], branches: [], featureReleases: [] };
          });
        this.loadBuildsCompare();
      }
    } catch (error) {
      console.error('Error fetching upgrade information', error);
      this.errorKey = 'instance.upgrade.error.deploy_info_fetch';
    } finally {
      this.loadingPageStatus = false;
    }
  }

  /**
   * Determines whether a given build is potentially incompatible with the current deploy.
   * Returns false if deployInfo has not loaded yet.
   * Delegates to VersionService for the actual comparison logic.
   *
   * @param {Build} release - the build to check
   * @returns {boolean}
   */
  potentiallyIncompatible(release: Build): boolean {
    if (!this.deployInfo) {
      return false;
    }
    return this.versionService.potentiallyIncompatible(release, this.deployInfo);
  }

  private async loadCurrentUpgrade(): Promise<void> {
    const { buildsUrl, upgradeDoc, indexers } = await this.upgradeService.getCurrentUpgrade();
    this.upgradeDoc = upgradeDoc;
    this.indexerProgress = indexers;
    
    if (upgradeDoc) {
      this.startPolling();
    }
  }

  private async loadBuildsCompare(): Promise<void> {
    for (const release of this.versionGroups.releases) {
      await this.upgradeService.compareReleases(release);
    }
    for (const beta of this.versionGroups.betas) {
      await this.upgradeService.compareReleases(beta);
    
    }
  }

  private startPolling(): void {
    this.pollingTimeout = setTimeout( async () => {
      const { upgradeDoc, indexers } = await this.upgradeService.getCurrentUpgrade();
      this.upgradeDoc = upgradeDoc;
      this.indexerProgress = indexers;

      if (upgradeDoc) {
        this.startPolling();
      } else {
        this.versionGroups = await this.upgradeService.getBuilds(this.deployInfo!)
          .catch((error) => {
            console.error('Error fetching builds', error);
            this.errorKey = 'instance.upgrade.error.version_fetch';
            return { releases: [], betas: [], branches: [], featureReleases: [] };
          });
        await this.loadBuildsCompare();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
    }
  }

  async upgrade(build: Build, action: 'stage' | 'complete'): Promise<void> {
    await this.upgradeService.compareReleases(build);
    this.confirmBuild = build;
    this.confirmStageOnly = action === 'stage';
    this.confirmCallback = () => this.confirmUpgrade(build, action);
    this.showConfirmModal = true;
  }

  private async confirmUpgrade(build: Build, action: 'stage' | 'complete'): Promise<void> {
    if (action === 'stage') {
      await this.upgradeService.stage(build);
    } else {
      await this.upgradeService.completeInstall(build);
    }
    await this.loadCurrentUpgrade();
  }

  abortUpgrade(): void {
    this.abortCallback = async () => {
      await this.upgradeService.abortUpgrade();
      await this.loadCurrentUpgrade();
      this.versionGroups = await this.upgradeService.getBuilds(this.deployInfo!)
        .catch((error) => {
          console.error('Error fetching builds', error);
          this.errorKey = 'instance.upgrade.error.version_fetch';
          return { releases: [], betas: [], branches: [], featureReleases: [] };
        });
      await this.loadBuildsCompare();
    };
    this.showAbortModal = true;
  }

  retryUpgrade(): void {
    if (!this.upgradeDoc) {
      return;
    }
    const action = this.upgradeDoc.action === 'stage' ? 'stage' : 'complete';
    this.upgrade(this.upgradeDoc.to, action);
  }
}
