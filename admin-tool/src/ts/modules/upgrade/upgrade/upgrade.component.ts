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

/**
 * Component for managing CHT instance upgrades.
 *
 * Loads the current deployment information, upgrade availability and available
 * builds on init. Displays the current version details and a list of available
 * releases organized by type — stable releases, betas, branches and feature releases.
 * If an upgrade is already in progress on init, skips loading builds and starts
 * polling the upgrade state every 2 seconds instead.
 * Allows administrators to stage, install or abort upgrades via confirmation modals.
 *
 * Part of the Upgrade module.
 */
@Component({
  selector: 'upgrade',
  imports: [TranslatePipe, DatePipe, UpgradeConfirmComponent],
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

  /** The in-progress upgrade document, null when no upgrade is active */
  upgradeDoc: UpgradeDoc | null = null;

  /** Real-time indexer progress entries shown as progress bars during indexing */
  indexerProgress: IndexerProgress[] = [];

  /** Set to true when an upgrade completes successfully, shows the success banner */
  upgraded = false;

  /** Controls visibility of the confirmation modal for stage, install and abort actions */
  showConfirmModal= false;

  /** The build being confirmed in the modal, passed as input to the modal */
  confirmBuild: Build | null = null;

  /** Whether the confirmation modal should show stage-specific text */
  confirmStageOnly = false;

  /** The function the confirmation modal will execute when the user confirms */
  confirmCallback: (() => Promise<void>) | null = null;

  /** Reference to the polling timeout, used to cancel it in ngOnDestroy */
  private pollingTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Whether the confirmation modal is being used for an abort action */
  confirmIsAbort = false;

  /** Translation key for the error message emitted by the confirmation modal if the action fails */
  confirmErrorKey = 'instance.upgrade.error.deploy';
  
  constructor(
    private upgradeService: UpgradeService,
    private versionService: VersionService,
  ){}

  /**
   * Fetches the current deployment information, upgrade availability and current upgrade state on init.
   * If no upgrade is in progress, loads available builds and starts the compare process.
   * If an upgrade is already in progress, skips loading builds and starts polling instead.
   * Sets errorKey with the appropriate translation key if any request fails.
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

  /**
   * Fetches the current upgrade state from the service and updates upgradeDoc and indexerProgress.
   * Starts polling if an upgrade is in progress.
   */
  private async loadCurrentUpgrade(): Promise<void> {
    const { upgradeDoc, indexers } = await this.upgradeService.getCurrentUpgrade();
    this.upgradeDoc = upgradeDoc;
    this.indexerProgress = indexers;
    
    if (upgradeDoc) {
      this.startPolling();
    }
  }

  /**
   * Calls compareReleases for all releases and betas sequentially.
   * Branches and feature releases are excluded — branches change too frequently
   * and feature releases are only compared on demand when the user opens the modal.
   * Does not await — runs in the background so the UI is not blocked.
   */
  private async loadBuildsCompare(): Promise<void> {
    for (const release of this.versionGroups.releases) {
      await this.upgradeService.compareReleases(release);
    }
    for (const beta of this.versionGroups.betas) {
      await this.upgradeService.compareReleases(beta);
    
    }
  }

  /**
   * Schedules a polling call to getCurrentUpgrade every 2 seconds while an upgrade is active.
   * When the upgradeDoc disappears, verifies whether the upgrade succeeded by comparing
   * the expected build with the freshly deployed version.
   * Sets upgraded to true on success or errorKey on failure.
   * Reloads builds and compare data after the upgrade completes or fails.
   */
  private startPolling(): void {
    this.pollingTimeout = setTimeout(async () => {
      const { upgradeDoc, indexers } = await this.upgradeService.getCurrentUpgrade();
      
      const hadUpgradeDoc = !!this.upgradeDoc;
      this.upgradeDoc = upgradeDoc;
      this.indexerProgress = indexers;

      if (upgradeDoc) {
        this.startPolling();
      } else {
        const expectedBuild = this.upgradeDoc?.to?.build;
        this.upgradeDoc = upgradeDoc;
        this.indexerProgress = indexers;

        if (hadUpgradeDoc) {
          const freshDeployInfo = await this.upgradeService.getDeployInfo();
          if (freshDeployInfo.build === expectedBuild) {
            this.upgraded = true;
          } else {
            this.errorKey = 'instance.upgrade.error.deploy';
          }
        }

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

  /**
   * Cancels the polling timeout when the component is destroyed
   * to prevent memory leaks and errors from callbacks running after destruction.
   */
  ngOnDestroy(): void {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
    }
  }

  /**
   * Opens the confirmation modal for a stage, install or direct install action.
   * Calls compareReleases first to populate indexing information in the modal.
   * Sets confirmIsAbort to false and confirmErrorKey to the deploy error key.
   *
   * @param {Build} build - the build to stage or install
   * @param {'stage' | 'complete' | undefined} action - the action to perform
   */
  async upgrade(build: Build, action: 'stage' | 'complete' | undefined): Promise<void> {
    await this.upgradeService.compareReleases(build);
    this.confirmBuild = build;
    this.confirmStageOnly = action === 'stage';
    this.confirmIsAbort = false;
    this.confirmErrorKey = 'instance.upgrade.error.deploy';
    this.confirmCallback = () => this.confirmUpgrade(build, action);
    this.showConfirmModal = true;
  }

  /**
   * Executes the upgrade action after the user confirms in the modal.
   * Delegates to stage, completeInstall or install on UpgradeService depending on the action.
   * Calls loadCurrentUpgrade after the action to refresh the upgrade state and start polling.
   *
   * @param {Build} build - the build to upgrade to
   * @param {'stage' | 'complete' | undefined} action - the action to perform
   */
  private async confirmUpgrade(build: Build, action: 'stage' | 'complete' | undefined): Promise<void> {
    if (action === 'stage') {
      await this.upgradeService.stage(build);
    } else if (action === 'complete') {
      await this.upgradeService.completeInstall(build);
    } else {
      await this.upgradeService.install(build);
    }
    await this.loadCurrentUpgrade();
  }

  /**
   * Opens the confirmation modal configured for an abort action.
   * Sets confirmIsAbort to true and confirmErrorKey to the abort error key.
   * The callback aborts the upgrade, refreshes the state and reloads builds.
   */
  abortUpgrade(): void {
    this.confirmIsAbort = true;
    this.confirmErrorKey = 'instance.upgrade.error.abort';
    this.confirmCallback = async () => {
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
    this.showConfirmModal = true;
  }

  /**
   * Retries the interrupted upgrade using the same action as the original.
   * Does nothing if there is no upgrade document in progress.
   * Delegates to upgrade() which opens the confirmation modal.
   */
  retryUpgrade(): void {
    if (!this.upgradeDoc) {
      return;
    }
    const action = this.upgradeDoc.action === 'stage' ? 'stage' : 'complete';
    this.upgrade(this.upgradeDoc.to, action);
  }
}
