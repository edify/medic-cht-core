import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { DeployInfo } from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { DatePipe } from '@angular/common';

/**
 * Component for managing CHT instance upgrades.
 *
 * Loads the current deployment information and upgrade availability on init.
 * Displays the current version details including version, build, deployed by and date.
 * Further functionality for listing available builds, staging, installing
 * and monitoring upgrade progress will be added in subsequent stories.
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
  
  constructor(private upgradeService: UpgradeService){}

  /**
   * Fetches the current deployment information and upgrade availability on init.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.deployInfo = await this.upgradeService.getDeployInfo();
      this.canUpgrade = await this.upgradeService.getCanUpgrade();
    } catch (error) {
      console.error('Error fetching upgrade information', error);
      this.loadingError = true;
    } finally {
      this.loadingPageStatus = false;
    }
  }

}
