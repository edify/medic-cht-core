import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { SettingsService } from './settings.service';
import { LanguageDoc, LanguageModel } from '@admin-tool-modules/display/display-interfaces';

/**
 * Service responsible for reading and writing CHT language documents
 * stored in CouchDB as 'messages-{code}' documents.
 *
 * Reads are done via DbService using allDocs with a key range.
 * Writes to language documents are done via DbService using put and remove directly on CouchDB.
 * Enable and disable operations update settings.languages via SettingsService.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguagesService {

  constructor(private db: DbService, private settingsService: SettingsService) { }

  /**
   * Fetches all languages documents from CouchDB and combines them
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
      const enabled = settings.languages?.length 
        ? languageSetting ? languageSetting.enabled !== false : false
        : true;
      const missing = this.countMissingTranslations(doc, totalTranslations);
      return { doc, enabled, missing };
    });
    return languages;
  }
  
  /**
   * Counts the total number of unique translation keys across all language documents.
   * Combines generic and custom keys for each document before counting.
   *
   * @param {LanguageDoc[]} docs - all language documents
   * @returns {number}
   */
  private countTotalTranslations(docs: LanguageDoc[]): number {
    const allKeys = docs.flatMap(doc => Object.keys({ ...doc.generic, ...doc.custom }));
    return new Set(allKeys).size;
  }
  
  /**
   * Counts the number of translation keys missing from a specific language document
   * compared to the total number of unique keys across all language documents.
   *
   * @param {LanguageDoc} doc - the language document to check
   * @param {number} total - the total number of unique keys across all language documents
   * @returns {number}
   */
  private countMissingTranslations(doc: LanguageDoc, total: number): number {
    const docKeys = Object.keys({ ...doc.generic, ...doc.custom });
    return total - docKeys.length;
  }
  

  /**
   * Saves a language document to CouchDB.
   * If the document does not have an _id (new language), assigns one as 'messages-' + doc.code.
   * If the document already has an _id and _rev (edit), updates the existing document.
   *
   * @param {LanguageDoc} doc - the language document to save
   * @returns {Promise<void>}
   */
  async saveLanguage(doc: LanguageDoc): Promise<void> {
    if (!doc._id) {
      doc._id = 'messages-' + doc.code;
    }
    await this.db.get().put(doc);
  }

  /**
   * Removes a language document from CouchDB and cleans up its entry from settings.languages.
   * The document must have both _id and _rev for CouchDB to accept the removal.
   * After removal, filters out the language locale from settings.languages to keep settings in sync.
   *
   * @param {LanguageDoc} doc - the language document to remove
   * @returns {Promise<void>}
   */
  async deleteLanguage(doc: LanguageDoc): Promise<void> {
    await this.db.get().remove(doc);
    const settings = await this.settingsService.get();
    const languages = (settings.languages || []).filter(language => language.locale !== doc.code);
    await this.settingsService.updateSettings({ languages });
  }

  /**
   * Updates the enabled state of a language in settings.languages.
   * If the language entry does not exist, creates a new one with the given locale and enabled state.
   * Calls updateSettings with replace=false to merge without overwriting other settings.
   *
   * @param {LanguageDoc} doc - the language document whose locale will be matched in settings
   * @param {boolean} enabled - the enabled state to set
   * @returns {Promise<void>}
   */
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

  /**
   * Enables a language by setting its enabled state to true in settings.languages.
   *
   * @param {LanguageDoc} doc - the language document to enable
   * @returns {Promise<void>}
   */
  async enableLanguage(doc: LanguageDoc): Promise<void> {
    await this.setLanguageStatus(doc, true);
  }

  /**
   * Disables a language by setting its enabled state to false in settings.languages.
   *
   * @param {LanguageDoc} doc - the language document to disable
   * @returns {Promise<void>}
   */
  async disableLanguage(doc: LanguageDoc): Promise<void> {
    await this.setLanguageStatus(doc, false);
  }
}
