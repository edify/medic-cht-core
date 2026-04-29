import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Component for managing resource icons in the CHT instance.
 *
 * Loads the resources document from CouchDB on init and displays
 * all installed icons in a list showing the icon image and its name.
 * Allows administrators to upload new icons by providing a name
 * and selecting an image file.
 *
 * Part of the Images module.
 */
@Component({
  selector: 'images-icons',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './images-icons.component.html',
  styleUrl: './images-icons.component.less'
})
export class ImagesIconsComponent implements OnInit {

  /** Reference to the name input element for resetting its value after a successful upload */
  @ViewChild('nameInput') nameInputRef!: ElementRef<HTMLInputElement>;

  /** Reference to the file input element for resetting its value after a successful upload */
  @ViewChild('iconFile') iconFileRef!: ElementRef<HTMLInputElement>;

  /** List of icon names fetched from the resources document for template iteration */
  icons: string[] = [];

  /** Resources document loaded from CouchDB, used to resolve icon content and for upload operations */
  resourcesDoc: ResourcesDoc | null = null;

  /** Controls visibility of the loader while the resources document is being fetched */
  loadingPageStatus = false;

  /** Tracks the state of the upload operation for loading and error feedback */
  responseStatus: ResponseStatus = {};

  /** Model for the name input field of the upload form */
  iconName = '';

  constructor(
    private resourcesService: ResourcesService,
    private sanitizer: DomSanitizer
  ){}

  /**
   * Fetches the resources document from CouchDB on init and builds
   * the list of icon names for display in the installed icons table.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.resourcesDoc = await this.resourcesService.getResources();
      this.icons = Object.keys(this.resourcesDoc.resources);
    } catch (error) {
      console.error('Error fetching resources file', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  /**
   * Reloads the list of icons from CouchDB without triggering the full page loader.
   * Called after a successful upload to reflect the newly added icon in the table.
   */
  private async reloadIcons(): Promise<void> {
    try {
      this.resourcesDoc = await this.resourcesService.getResources();
      this.icons = Object.keys(this.resourcesDoc.resources);
    } catch (error) {
      console.error('Error fetching resources file', error);
    }
  }

  /**
   * Resolves the icon content for a given icon name using the resources document.
   * Returns empty content if the resources document has not loaded yet
   * or if the icon name is empty.
   * Applies bypassSecurityTrustHtml for SVG icons to allow inline rendering.
   *
   * @param {string} iconName - the icon name as stored in the resources document
   * @returns {{ isSvg: boolean; content: string | SafeHtml }}
   */
  getIconContent(iconName: string): { isSvg: boolean; content: string | SafeHtml } {
    if (!this.resourcesDoc || !iconName) {
      return { isSvg: false, content: '' };
    }
    const result = this.resourcesService.getIconContent(iconName, this.resourcesDoc);
    if (result.isSvg) {
      return {
        isSvg: true,
        content: this.sanitizer.bypassSecurityTrustHtml(result.content)
      };
    }
    return result;
  }

  //TODO
  async upload(): Promise<void> {
    
  }

}
