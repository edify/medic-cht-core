import { LanguagesService } from '@admin-tool-services/languages.service';
import { Component, OnInit } from '@angular/core';
import { LanguageDoc, LanguageModel } from '../display-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { DisplayLanguagesEditComponent } from './display-languages-edit/display-languages-edit.component';
import { DisplayLanguagesDeleteComponent } from './display-languages-delete/display-languages-delete.component';
import { DisplayLanguagesUploadComponent } from './display-languages-upload/display-languages-upload.component';
import * as properties from 'properties';
import { SettingsService, LanguageSettings } from '@admin-tool-services/settings.service';
import { FormsModule } from '@angular/forms';

/**
 * Component for managing language documents in the CHT instance.
 *
 * Loads all language documents from CouchDB on init and displays them
 * in a Bootstrap 3 accordion. Each language panel shows the name,
 * missing translation count, and actions: Edit, Enable/Disable,
 * Download, Upload and Delete.
 *
 * Part of the Display module.
 */
@Component({
  selector: 'display-languages',
  imports: [
    TranslatePipe, 
    FormsModule,
    DisplayLanguagesEditComponent, 
    DisplayLanguagesDeleteComponent, 
    DisplayLanguagesUploadComponent
  ],
  templateUrl: './display-languages.component.html',
  styleUrl: './display-languages.component.less'
})
export class DisplayLanguagesComponent implements OnInit {

  /** List of language models for template iteration */
  languages: LanguageModel[] = [];

  /** Controls visibility of the loader while languages are being fetched */
  loadingPageStatus = false;

  /** Tracks the state of save/edit/delete operations */
  responseStatus: ResponseStatus = {};

  /** Controls visibility of the add/edit language modal */
  showEditModal = false;

  /** Language document to edit, delete, upload, or null when adding a new language */
  selectedDoc: LanguageDoc | null = null;

  /** Controls visibility of the delete confirmation modal */
  showDeleteModal = false;

  /** Controls visibility of the upload modal */
  showUploadModal = false;

  localeLanguage = '';
  localeOutgoingLanguage = '';

  constructor(private languageService: LanguagesService, private settingsService: SettingsService){}

  /**
   * Fetches all language documents on init and builds the UI model.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.languages = await this.languageService.getLanguages();
      const languageSettings: LanguageSettings = await this.settingsService.getLanguageSettings();
      this.localeLanguage = languageSettings.locale;
      this.localeOutgoingLanguage = languageSettings.localeOutgoing;
    } catch (error) {
      console.error('Error fetching languages', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  async submitLanguageSettings(): Promise<void> {
    this.responseStatus = { state: 'loading'};
    
    try{
      await this.settingsService.updateLanguageSettings({
        locale: this.localeLanguage,
        localeOutgoing: this.localeOutgoingLanguage
      });
      this.responseStatus = { state: 'success', msg: 'Saved'};
      setTimeout(() => {
        if(this.responseStatus.state === 'success') {
          this.responseStatus = {};
        }
      }, 3000);

    } catch (error) {
      console.error('Error updating language settings', error);
      this.responseStatus = { state: 'error', msg: 'Error saving language settings'};
    }
  }

  /**
   * Disables a language by updating its enabled state in settings.languages.
   * Reloads the language list after success.
   *
   * @param {LanguageDoc} doc - the language document to disable
   */
  async disableLanguage(doc: LanguageDoc): Promise<void> {
    try {
      await this.languageService.disableLanguage(doc);
      await this.ngOnInit();
    } catch (error) {
      console.error('Error disabling language', error);
    }
  }

  /**
   * Enables a language by updating its enabled state in settings.languages.
   * Reloads the language list after success.
   *
   * @param {LanguageDoc} doc - the language document to enable
   */
  async enableLanguage(doc: LanguageDoc): Promise<void> {
    try {
      await this.languageService.enableLanguage(doc);
      await this.ngOnInit();
    } catch (error) {
      console.error('Error enabling language', error);
    }
  }


  /**
   * Opens the edit modal with the selected language document.
   *
   * @param {LanguageDoc} doc - the language document to edit
   */
  async editLanguage(doc: LanguageDoc): Promise<void> {
    this.selectedDoc = doc;
    this.showEditModal = true;
  }

  /**
   * Opens the upload modal with the selected language document.
   *
   * @param {LanguageDoc} doc - the language document to import translations into
   */
  async uploadLanguage(doc: LanguageDoc): Promise<void> {
    this.selectedDoc = doc;
    this.showUploadModal = true;
  }

  /**
   * Opens the delete confirmation modal with the selected language document.
   *
   * @param {LanguageDoc} doc - the language document to delete
   */
  async deleteLanguage(doc: LanguageDoc): Promise<void> {
    this.selectedDoc = doc;
    this.showDeleteModal = true;
  }

  /**
   * Opens the edit modal in add mode with an empty form.
   */
  async addLanguage(): Promise<void> {
    this.selectedDoc = null;
    this.showEditModal = true;
  }

  /**
   * Generates a .properties file from the language document's generic and custom
   * translations and triggers a browser download.
   * Custom translations override generic ones when keys conflict.
   * Does nothing if the document has no translations.
   *
   * @param {LanguageDoc} doc - the language document to export
   */
  downloadLanguage(doc: LanguageDoc): void {
    const values = { ...doc.generic, ...doc.custom };
    if (!Object.keys(values).length) {
      return;
    }
    const stringifier = properties.createStringifier();

    Object.keys(values).forEach(key => {
      stringifier.property({ key, value: values[key] });
    });

    const content = properties.stringify(stringifier);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = (window.URL || (window as any).webkitURL).createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc._id}.properties`;
    a.click();
    setTimeout(() => {
      (window.URL || (window as any).webkitURL).revokeObjectURL(url);
    }, 100);
  }
}
