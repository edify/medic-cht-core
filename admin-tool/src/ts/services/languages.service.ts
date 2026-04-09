import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { SettingsService } from './settings.service';
import { LanguageDoc, LanguageModel } from '@admin-tool-modules/display/display-interfaces';

/**
 * Service responsible for reading and writing CHT translation documents
 * stored in CouchDB as 'messages-{code}' documents.
 *
 * Reads are done via DbService using allDocs with a key range.
 * Writes to translation documents are done via DbService using put and remove directly on CouchDB.
 * Enable and disable operations update settings.languages via SettingsService.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguagesService {

  constructor(private db: DbService, private settingsService: SettingsService) { }

  /**
   * Fetches all translation documents from CouchDB and combines them
   * with the enabled state from settings.languages to build the UI model.
   *
   * @returns {Promise<LanguageModel[]>}
   */
  async getLanguages(): Promise<LanguageModel[]> {
    const result = await this.db.get().allDocs({
      startkey: 'messages-',
      endkey: 'messages-\ufff0',
      include_docs: true
    });
    const settings = await this.settingsService.get();
    
    const docs = result.rows.map(row => row.doc as LanguageDoc);
    const totalTranslations = this.countTotalTranslations(docs);

    const languages = result.rows.map(row => {
      const doc = row.doc as LanguageDoc;
      const languageSetting = settings.languages?.find(language => language.locale === doc.code);
      const enabled = languageSetting ? languageSetting.enabled !== false : true;
      const missing = this.countMissingTranslations(doc, totalTranslations);
      return { doc, enabled, missing };
    });
    return languages;
  }
  
  /**
   * Counts the total number of unique translation keys across all language documents.
   * Combines generic and custom keys for each document before counting.
   *
   * @param {LanguageDoc[]} docs - all translation documents
   * @returns {number}
   */
  private countTotalTranslations(docs: LanguageDoc[]): number {
    const allKeys = docs.flatMap(doc => 
      Object.keys({ ...doc.generic, ...doc.custom })
    );
    return new Set(allKeys).size;
  }
  
  /**
   * Counts the number of translation keys missing from a specific language document
   * compared to the total number of unique keys across all documents.
   *
   * @param {LanguageDoc} doc - the translation document to check
   * @param {number} total - the total number of unique keys across all documents
   * @returns {number}
   */
  private countMissingTranslations(doc: LanguageDoc, total: number): number {
    const docKeys = Object.keys({ ...doc.generic, ...doc.custom });
    return total - docKeys.length;
  }
  
  //TODO: Implement saveLanguage
  async saveLanguage(doc: LanguageDoc): Promise<void> {
  }

  //TODO: Implement deleteLanguage
  async deleteLanguage(doc: LanguageDoc): Promise<void> {
  }

}
