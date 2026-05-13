import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { HeaderTab, HeaderTabsMap } from '@admin-tool-modules/images/images-interfaces';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { SettingsService } from '@admin-tool-services/settings.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Hardcoded list of CHT application navigation tabs.
 * Defines the name, translation key and default FontAwesome icon for each tab.
 * name is the key used in settings.header_tabs.
 * This list mirrors the tabs defined in the CHT webapp and must be updated
 * manually if tabs are added or removed from the application.
 */
const HEADER_TABS: HeaderTab[] = [
  { name: 'messages', translation: 'Messages', defaultIcon: 'fa-envelope' },
  { name: 'tasks', translation: 'Tasks', defaultIcon: 'fa-flag' },
  { name: 'reports', translation: 'Reports', defaultIcon: 'fa-list-alt' },
  { name: 'contacts', translation: 'Contacts', defaultIcon: 'fa-user' },
  { name: 'analytics', translation: 'Analytics', defaultIcon: 'fa-bar-chart-o' },
];

/**
 * Component for managing the icon configuration of the CHT application
 * navigation tabs.
 *
 * Loads the available SVG resource icons and the current header tabs
 * configuration from settings on init.
 * Displays a table with one row per tab showing the default icon,
 * a customizable FontAwesome icon field, and a select for SVG resource icons.
 * Allows administrators to configure custom icons for each navigation tab
 * and save the configuration to settings via a single submit operation.
 *
 * Part of the Images module.
 */
@Component({
  selector: 'images-header-tabs-icons',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './images-header-tabs-icons.component.html',
  styleUrl: './images-header-tabs-icons.component.less'
})
export class ImagesHeaderTabsIconsComponent implements OnInit{

  /** List of navigation tabs for template iteration, sourced from the HEADER_TABS constant */
  tabs: HeaderTab[] = HEADER_TABS;

  /** List of SVG icon names available for selection, filtered from the resources document */
  resourceIcons: string[] = [];

  /** Icon configuration map for all tabs, keyed by tab name */
  tabsConfig: HeaderTabsMap = {};

  /** Resources document loaded from CouchDB, used to resolve SVG icon previews */
  resourcesDoc: ResourcesDoc | null = null;

  /** Controls visibility of the loader while resources and settings are being fetched */
  loadingPageStatus = false;

  /** Tracks the state of the submit operation for loading and error feedback */
  responseStatus: ResponseStatus = {};

  /** Set to true when the initial data load fails, shows the error alert and hides the table */
  loadingError = false;

  constructor( 
    private resourcesService: ResourcesService, 
    private settingsService: SettingsService,
    private sanitizer: DomSanitizer,
  ) {}

  /**
   * Fetches the resources document and settings on init.
   * Loads SVG resource icons and the current header tabs configuration.
   * Sets loadingError to true if either request fails.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;

    try {
      await this.loadResourceIcons();
      await this.loadTabsConfig();
    } catch (error) {
      console.error('Error loading settings', error);
      this.loadingError = true;
    } finally {
      this.loadingPageStatus = false;
    }
  }

  /**
   * Fetches the resources document from CouchDB and filters
   * the available icons to only include SVG types.
   * Called by ngOnInit before loadTabsConfig to ensure resourceIcons
   * is populated before the obsolete icon cleanup runs.
   */
  private async loadResourceIcons(): Promise<void> {
    this.resourcesDoc = await this.resourcesService.getResources();
    this.resourceIcons = Object.keys(this.resourcesDoc.resources).filter(key => {
      const attachmentName = this.resourcesDoc!.resources[key];
      const attachment = this.resourcesDoc!._attachments[attachmentName];
      return attachment?.content_type === 'image/svg+xml';
    });
  }

  /**
   * Fetches the header tabs configuration from settings and initializes
   * all tabs that have no saved configuration with empty values.
   * Clears any resource_icon that no longer exists in the available SVG icons.
   * Depends on loadResourceIcons having run first.
   */
  private async loadTabsConfig(): Promise<void> {
    const headerTabsConfig = await this.settingsService.getHeaderTabsSettings();
    HEADER_TABS.forEach(tab => {
      if (!headerTabsConfig[tab.name]){
        headerTabsConfig[tab.name] = { icon: '', resource_icon: ''};
      }
      if ( 
        headerTabsConfig[tab.name].resource_icon && 
        !this.resourceIcons.includes(headerTabsConfig[tab.name].resource_icon)
      ){
        headerTabsConfig[tab.name].resource_icon = '';
      }
    });
    this.tabsConfig = headerTabsConfig;
  }

  /**
   * Resolves an SVG resource icon name to its sanitized inline HTML content
   * for preview rendering in the template.
   * Returns null if the resources document has not loaded yet,
   * if the key is empty, or if the icon has no content.
   *
   * @param {string} key - the resource icon name (e.g. 'icon-pregnancy')
   * @returns {SafeHtml | null}
   */
  getIconContent(key: string): SafeHtml | null {
    if (!this.resourcesDoc || !key) {
      return null;
    }
    const result = this.resourcesService.getIconContent(key, this.resourcesDoc);
    if (!result.content) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(result.content);
  }

  /**
   * Saves the header tabs icon configuration to settings via SettingsService.
   * Shows a loader during the operation and displays success or error feedback.
   */
  async submit(): Promise<void> {
    this.responseStatus = { state: 'loading' };
    try {
      await this.settingsService.updateHeaderTabsSettings(this.tabsConfig);
      this.responseStatus = { state: 'success', msg: 'images.header.tabs.icons.submit.success' };
    } catch (error) {
      console.error('Error updating settings', error);
      this.responseStatus = { state: 'error', msg: 'images.header.tabs.icons.submit.failure' };
    }
  }
}
