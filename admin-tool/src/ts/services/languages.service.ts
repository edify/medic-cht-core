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
  

  async saveLanguage(doc: LanguageDoc): Promise<void> {
    if (!doc._id) {
      doc._id = 'messages-' + doc.code;
    }
    await this.db.get().put(doc);
  }

  async deleteLanguage(doc: LanguageDoc): Promise<void> {
    await this.db.get().remove(doc);
  }

  private async setLanguageStatus(doc: LanguageDoc, enabled: boolean): Promise<void> {
    const settings = await this.settingsService.get();
    const languages = settings.languages || [];
    let language = languages.find(l => l.locale === doc.code);
    if (!language) {
      language = { locale: doc.code, enabled };
      languages.push(language);
    }
    language.enabled = enabled;
    await this.settingsService.updateSettings({ languages });
  }

  async enableLanguage(doc: LanguageDoc): Promise<void> {
    await this.setLanguageStatus(doc, true);
  }

  async disableLanguage(doc: LanguageDoc): Promise<void> {
    await this.setLanguageStatus(doc, false);
  }


}
