import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { HeaderTab, HeaderTabsMap } from '@admin-tool-modules/images/images-interfaces';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { SettingsService } from '@admin-tool-services/settings.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const HEADER_TABS: HeaderTab[] = [
  { name: 'messages', translation: 'Messages', defaultIcon: 'fa-envelope' },
  { name: 'tasks', translation: 'Tasks', defaultIcon: 'fa-flag' },
  { name: 'reports', translation: 'Reports', defaultIcon: 'fa-list-alt' },
  { name: 'contacts', translation: 'Contacts', defaultIcon: 'fa-user' },
  { name: 'analytics', translation: 'Analytics', defaultIcon: 'fa-bar-chart-o' },
];

@Component({
  selector: 'images-header-tabs-icons',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './images-header-tabs-icons.component.html',
  styleUrl: './images-header-tabs-icons.component.less'
})
export class ImagesHeaderTabsIconsComponent implements OnInit{

  tabs: HeaderTab[] = HEADER_TABS;
  resourceIcons: string[] = [];
  tabsConfig: HeaderTabsMap = {};
  resourcesDoc: ResourcesDoc | null = null;
  loadingPageStatus = false;
  responseStatus: ResponseStatus = {};
  loadingError = false;

  constructor( 
    private resourcesService: ResourcesService, 
    private settingsService: SettingsService,
    private sanitizer: DomSanitizer,
  ) {}

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

  private async loadResourceIcons(): Promise<void> {
    this.resourcesDoc = await this.resourcesService.getResources();
    this.resourceIcons = Object.keys(this.resourcesDoc.resources).filter(key => {
      const attachmentName = this.resourcesDoc!.resources[key];
      const attachment = this.resourcesDoc!._attachments[attachmentName];
      return attachment?.content_type === 'image/svg+xml';
    });
  }

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

  //TODO
  async submit(): Promise<void> {}

}
