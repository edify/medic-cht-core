import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { BrandingService } from '@admin-tool-services/branding.service';
import { BrandingDoc } from '@admin-tool-modules/images/images-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';

const MAX_BRANDING_FILE_SIZE = 100000;

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
      await this.reloadBranding();
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

  /**
   * Reloads the branding document from CouchDB without triggering the full page loader.
   * Called after a successful submit to reflect the updated title and images.
   */
  private async reloadBranding(): Promise<void> {
    this.brandingDoc = await this.brandingService.getBranding();
    this.title = this.brandingDoc.title;
  }

  /**
   * Validates the upload form fields before submitting.
   * Checks that the title is not empty and that no file exceeds the 100KB size limit.
   * Sets responseStatus to error with the appropriate message on the first failing validation.
   *
   * @param {File} [logo] - optional logo file to validate
   * @param {File} [favicon] - optional favicon file to validate
   * @param {File} [icon] - optional icon file to validate
   * @returns {boolean} true if all validations pass, false otherwise
   */
  private validateUpload(logo?: File, favicon?: File, icon?: File): boolean {
    if (!this.title) {
      this.responseStatus = {
        state: 'error',
        msg: this.translate.instant('field is required', {
          field: this.translate.instant('branding.title.field')
        })
      };
      return false;
    }
    const files = [logo, favicon, icon].filter((file): file is File => !!file);
    for (const file of files) {
      if (file.size > MAX_BRANDING_FILE_SIZE) {
        this.responseStatus = {
          state: 'error',
          msg: this.translate.instant('error.file.size', { size: `${MAX_BRANDING_FILE_SIZE / 1000}KB` })
        };
        return false;
      }
    }
    return true;
  }

  /**
   * Saves the branding configuration to CouchDB.
   * Validates the title and file sizes before proceeding.
   * Resets all file inputs and reloads the branding document after a successful save.
   * Sets responseStatus to error if the save fails.
   */
  async submit(): Promise<void> {
    const logo = this.logoFileRef.nativeElement.files?.[0];
    const favicon = this.faviconFileRef.nativeElement.files?.[0];
    const icon = this.iconFileRef.nativeElement.files?.[0];

    if (!this.validateUpload(logo, favicon, icon)) {
      return;
    }

    this.responseStatus = { state: 'loading' };
    try {
      await this.brandingService.updateBranding(this.title, this.brandingDoc!, logo, favicon, icon);
      this.logoFileRef.nativeElement.value = '';
      this.faviconFileRef.nativeElement.value = '';
      this.iconFileRef.nativeElement.value = '';
      await this.reloadBranding();
      this.responseStatus = {};
    } catch (error) {
      console.error('Error saving branding document', error);
      this.responseStatus = { state: 'error', msg: 'Error saving settings' };
    }
  }

}
