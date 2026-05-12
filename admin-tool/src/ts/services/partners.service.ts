import { Injectable } from '@angular/core';
import { DbService } from '@admin-tool-services/db.service';
import { BrandingAttachment, PartnersDoc } from '@admin-tool-modules/images/images-interfaces';

/**
 * Service responsible for loading and managing partner logo documents from CouchDB.
 * Partner logos are stored as attachments in the 'partners' document.
 * The resources map links partner names to their attachment filenames.
 */
@Injectable({
  providedIn: 'root'
})
export class PartnersService {

  constructor(private db: DbService) {}

  /**
   * Fetches the partners document from CouchDB including all attachment data.
   * If the document does not exist, returns an empty document instead of throwing.
   * attachments: true is required to retrieve the base64 content of each image.
   *
   * @returns {Promise<PartnersDoc>}
   */
  async getPartners(): Promise<PartnersDoc> {
    const emptyDoc: PartnersDoc = {
      _id: 'partners',
      resources: {},
      _attachments: {},
    };
    const doc = await this.db.get().get('partners', { attachments: true })
      .catch(err => {
        if (err.status === 404) {
          return emptyDoc;
        }
        throw err;
      });
    return doc;
  }
  
  /**
   * Resolves a partner name to its data URI using the partners document.
   * Returns null if the key does not exist in the resources map, if the attachment
   * has no data, or if the data is not a base64 string.
   *
   * @param {string} key - the partner name as stored in the resources map (e.g. 'apple')
   * @param {PartnersDoc} doc - the partners document fetched with attachments: true
   * @returns {string | null} the data URI string or null if the image cannot be resolved
   */
  getImageContent(key: string, doc: PartnersDoc): string | null {
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
   * Uploads a new partner logo to the partners document in CouchDB.
   * Fetches the current document with attachments to obtain the latest _rev,
   * adds the file directly to the document attachments, updates the resources map,
   * and saves everything in a single put operation.
   *
   * @param {string} name - the logical partner name to register in the resources map
   * @param {File} file - the logo file to attach
   * @returns {Promise<void>}
   */
  async uploadPartner(name: string, file: File): Promise<void> {
    const doc = await this.getPartners();
    doc._attachments[file.name] = {
      content_type: file.type,
      data: file as any,
    };
    doc.resources[name] = file.name;
    await this.db.get().put(doc);
  }
}
