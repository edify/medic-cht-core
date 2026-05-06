import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { BrandingService } from '@admin-tool-services/branding.service';
import { BrandingDoc } from '@admin-tool-modules/images/images-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';

/**
 * Component for managing the application branding configuration in the CHT instance.
 *
 * Loads the branding document from CouchDB on init and displays the current
 * title and image previews for logo, favicon and icon.
 * Allows administrators to update the application title and upload new images.
 *
 * Part of the Images module.
 */
@Component({
  selector: 'images-branding',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './images-branding.component.html',
  styleUrl: './images-branding.component.less'
})
export class ImagesBrandingComponent implements OnInit{

  /** Reference to the logo file input element for reading the selected file and resetting after submit */
  @ViewChild('logoFile') logoFileRef!: ElementRef<HTMLInputElement>;

  /** Reference to the favicon file input element for reading the selected file and resetting after submit */
  @ViewChild('faviconFile') faviconFileRef!: ElementRef<HTMLInputElement>;

  /** Reference to the icon file input element for reading the selected file and resetting after submit */
  @ViewChild('iconFile') iconFileRef!: ElementRef<HTMLInputElement>;
  
  /** Branding document loaded from CouchDB, used to resolve image previews and for submit operations */
  brandingDoc: BrandingDoc | null = null;

  /** Controls visibility of the loader while the branding document is being fetched */
  loadingPageStatus = false;

  /** Tracks the state of the submit operation for loading and error feedback */
  responseStatus: ResponseStatus = {};

  /** Model for the title input field */
  title = '';

  constructor(
    private brandingService: BrandingService,
    private translate: TranslateService
  ) { }

  /**
   * Fetches the branding document from CouchDB on init and initializes
   * the title input with the current value from the document.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.brandingDoc = await this.brandingService.getBranding();
      this.title = this.brandingDoc.title;
    } catch (error) {
      console.error('Error fetching branding document', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  /**
   * Resolves a logical image key to its data URI using the branding document.
   * Returns null if the branding document has not loaded yet or if the image
   * does not exist in the document.
   *
   * @param {string} key - the logical image key (e.g. 'logo', 'favicon', 'icon')
   * @returns {string | null}
   */
  getImageContent(key: string): string | null {
    if (!this.brandingDoc) {
      return null;
    }
    return this.brandingService.getImageContent(key, this.brandingDoc);
  }

  //TODO
  async submit(): Promise<void> {}

}
