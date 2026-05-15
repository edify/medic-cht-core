import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { VersionService } from '@admin-tool-services/version.service';
import { DeployInfo, VersionGroups, Build } from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { MOCK_VERSION_GROUPS } from '@admin-tool-modules/upgrade/upgrade-mock-data';

/**
 * Component for managing CHT instance upgrades.
 *
 * Loads the current deployment information, upgrade availability and available
 * builds on init. Displays the current version details and a list of available
 * releases organized by type — stable releases, betas, branches and feature releases.
 * Builds are loaded from mock data in this story and will be replaced with real
 * builds from the builds database in a subsequent story.
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

  /** Set to true when the initial data load fails, shows the error alert and hides the content */
  loadingError = false;

  /** Available builds grouped by type, loaded from mock data until real builds are connected */
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
   * Fetches the current deployment information and upgrade availability on init.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.deployInfo = await this.upgradeService.getDeployInfo();
      this.canUpgrade = await this.upgradeService.getCanUpgrade();
      this.versionGroups = MOCK_VERSION_GROUPS;
    } catch (error) {
      console.error('Error fetching upgrade information', error);
      this.loadingError = true;
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
