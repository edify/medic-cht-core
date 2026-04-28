import { Injectable } from '@angular/core';
import { DbService } from '@admin-tool-services/db.service';
import { FormDoc } from '@admin-tool-modules/forms/app-forms-interfaces';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Service responsible for reading XForm documents stored in CouchDB.
 * Form documents are identified by type 'form' and have IDs prefixed with 'form:'.
 * Reads are done via DbService using the medic-client/doc_by_type view.
 */
@Injectable({
  providedIn: 'root'
})
export class AppFormsService {

  constructor(private db: DbService, private http: HttpClient) { }

  /**
   * Fetches all form documents from CouchDB via the medic-client/doc_by_type view.
   * Returns the full document for each form ordered as returned by CouchDB.
   *
   * @returns {Promise<FormDoc[]>}
   */
  async getForms(): Promise<FormDoc[]> {
    const result = await this.db.get().query('medic-client/doc_by_type', {
      include_docs: true,
      key: ['form']
    });

    return result.rows.map((row) => row.doc as FormDoc);
  }
  getXmlTitle(xml: string): string {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    let title = doc.querySelector('title')?.textContent ?? '';
    if (!title) {
      const match = xml.match(/<h:title[^>]*>([^<]*)<\/h:title>/);
      if (match) {
        title = match[1];
      }
    }
    return title;
  }

  getXmlFormId(xml: string, meta: Record<string, any>): string {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const instance = doc.querySelector('instance');
    const dataNode = instance?.children[0];

    if (!dataNode?.querySelector('meta > instanceID')) {
      throw new Error('No <meta><instanceID/></meta> node found for first child of <instance> element.');
    }

    const formId = dataNode.getAttribute('id');

    if (!formId) {
      throw new Error('No ID attribute found for first child of <instance> element.');
    }

    if (meta.internalId && meta.internalId !== formId) {
      throw new Error(
        'The internalId property in the meta file will be overwritten by the ID attribute on the first child ' +
        'of <instance> element in the XML. Remove this property from the meta file and try again.'
      );
    }

    return formId;
  }

  async getXmlHash(xml: string): Promise<string> {
    const utf8 = new TextEncoder().encode(xml);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async validateXml(xml: string): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/v1/forms/validate', xml, {
        headers: { 'Content-Type': 'application/xml' },
      })
    ).catch(err => {
      const errorMsg = err.error?.error ?? String(err);
      throw new Error('Error validating form - ' + errorMsg);
    });
  }

  async createDoc(xml: string, meta: Record<string, any>): Promise<FormDoc>{
    const title = this.getXmlTitle(xml);
    const internalId = this.getXmlFormId(xml, meta);
    const couchId = 'form:' + internalId;
    
    const doc: FormDoc = await this.db.get().get(couchId, {attachments: true})
      .catch((err) => {
        if (err.status === 404) {
          return { _id: couchId};
        }
        throw err;
      });

    doc.title = title;
    Object.assign(doc,meta);
    doc.type = 'form';
    doc.internalId = internalId;
    
    doc._attachments = doc._attachments || {};
    doc._attachments['xml'] = {
      content_type: 'application/xml',
      data: new Blob([xml], {type: 'application/xml'}) as any,
    };
    
    const hash = await this.getXmlHash(xml);
    doc.xmlVersion = {
      time: Date.now(),
      sha256: hash
    };
    
    return doc;
  }

  private readFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () => resolve(reader.result as string));
      reader.addEventListener('error', () => reject(reader.error));
      reader.addEventListener('abort', () => reject(new Error('FileReader aborted.')));
      reader.readAsText(file);
    });
  }

  async uploadForm(xmlFile: File, metaFile: File): Promise<void> {
    const xml = await this.readFile(xmlFile);
    const metaContent = await this.readFile(metaFile);
    const meta = JSON.parse(metaContent);

    await this.validateXml(xml);
    const doc = await this.createDoc(xml, meta);
    await this.db.get().put(doc);
  }
}
