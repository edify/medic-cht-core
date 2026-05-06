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

}