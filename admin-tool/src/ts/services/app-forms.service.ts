import { Injectable } from '@angular/core';
import { DbService } from '@admin-tool-services/db.service';
import { FormDoc } from '@admin-tool-modules/forms/app-forms-interfaces';

/**
 * Service responsible for reading XForm documents stored in CouchDB.
 * Form documents are identified by type 'form' and have IDs prefixed with 'form:'.
 * Reads are done via DbService using the medic-client/doc_by_type view.
 */
@Injectable({
  providedIn: 'root'
})
export class AppFormsService {

  constructor(private db: DbService) { }

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
}
