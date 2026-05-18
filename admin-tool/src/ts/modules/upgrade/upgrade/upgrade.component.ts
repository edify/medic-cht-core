import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { VersionService } from '@admin-tool-services/version.service';
import { DeployInfo, VersionGroups, Build } from '@admin-tool-modules/upgrade/upgrade-interfaces';

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
  imports: [TranslatePipe, DatePipe],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.less'
})
export class UpgradeComponent implements OnInit {

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
      this.versionGroups = await this.upgradeService.getBuilds(this.deployInfo!)
        .catch((error) => {
          console.error('Error fetching builds', error);
          this.errorKey = 'instance.upgrade.error.version_fetch';
          return { releases: [], betas: [], branches: [], featureReleases: [] };
        });
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
}
