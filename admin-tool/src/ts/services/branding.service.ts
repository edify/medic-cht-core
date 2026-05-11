import { Injectable } from '@angular/core';
import { DbService } from '@admin-tool-services/db.service';
import { BrandingAttachment, BrandingDoc } from '@admin-tool-modules/images/images-interfaces';

/**
 * Service responsible for loading and resolving branding resources from CouchDB.
 * Branding data is stored in the 'branding' document including the application title
 * and image attachments for logo, favicon and icon.
 */
@Injectable({
  providedIn: 'root'
})
export class BrandingService {

  constructor(private db: DbService) {}

  /**
   * Fetches the branding document from CouchDB including all attachment data.
   * attachments: true is required to retrieve the base64 content of each image.
   *
   * @returns {Promise<BrandingDoc>}
   */
  async getBranding(): Promise<BrandingDoc> {
    const doc = await this.db.get().get('branding', { attachments: true });
    return doc;
  }

  /**
   * Resolves a logical image key to its data URI using the branding document.
   * Returns null if the key does not exist in the resources map, if the attachment
   * has no data, or if the data is not a base64 string.
   *
   * @param {string} key - the logical image key (e.g. 'logo', 'favicon', 'icon')
   * @param {BrandingDoc} doc - the branding document fetched with attachments: true
   * @returns {string | null} the data URI string or null if the image cannot be resolved
   */
  getImageContent(key: string, doc: BrandingDoc): string | null {
    const attachmentName = doc.resources[key];
    if (!attachmentName) {
      return null;
    }

    const attachment: BrandingAttachment = doc._attachments[attachmentName];
    if (!attachment?.data || typeof attachment.data !== 'string') {
      return null;
    }

    const content = `data:${attachment.content_type};base64,${attachment.data}`;
    return content;
  }

  /**
   * Adds a file as an inline attachment to the branding document and updates
   * the resources map with the logical key pointing to the new filename.
   * PouchDB accepts a File object directly in data and handles the base64 conversion.
   *
   * @param {File} file - the image file to attach
   * @param {string} key - the logical image key (e.g. 'logo', 'favicon', 'icon')
   * @param {BrandingDoc} doc - the branding document to mutate
   */
  private updateImage(file: File, key: string, doc: BrandingDoc): void {
    doc._attachments[file.name] = {
      content_type: file.type,
      data: file as any,
    };
    doc.resources[key] = file.name;
  }

  /**
   * Removes attachments from the branding document that are no longer referenced
   * in the resources map. Rebuilds the attachments object keeping only the files
   * currently mapped to logo, favicon and icon.
   *
   * @param {BrandingDoc} doc - the branding document to mutate
   */
  private removeObsoleteAttachments(doc: BrandingDoc): void {
    const updatedAttachments: Record<string, BrandingAttachment> = {};
    ['logo', 'favicon', 'icon'].forEach(key => {
      const attachmentName = doc.resources[key];
      if (attachmentName) {
        updatedAttachments[attachmentName] = doc._attachments[attachmentName];
      }
    });
    doc._attachments = updatedAttachments;
  }

  /**
   * Saves the branding configuration to CouchDB.
   * Fetches a fresh copy of the document to obtain the latest _rev before applying changes.
   * Updates the title and adds any provided image files as inline attachments.
   * Removes obsolete attachments before saving to avoid accumulating orphaned files.
   * All changes are saved in a single put operation.
   *
   * @param {string} title - the new application title
   * @param {BrandingDoc} doc - the current branding document
   * @param {File} [logo] - optional new logo file
   * @param {File} [favicon] - optional new favicon file
   * @param {File} [icon] - optional new icon file
   * @returns {Promise<void>}
   */
  async updateBranding(title: string, doc: BrandingDoc, logo?: File, favicon?: File, icon?: File): Promise<void> {
    const freshDoc = await this.getBranding();
    freshDoc.title = title;

    if (logo) {
      this.updateImage(logo, 'logo', freshDoc);
    }
    if (favicon) {
      this.updateImage(favicon, 'favicon', freshDoc);
    }
    if (icon) {
      this.updateImage(icon, 'icon', freshDoc);
    }
    this.removeObsoleteAttachments(freshDoc);
    await this.db.get().put(freshDoc);
  }
}
