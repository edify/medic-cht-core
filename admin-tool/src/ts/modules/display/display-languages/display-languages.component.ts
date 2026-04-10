import { LanguagesService } from '@admin-tool-services/languages.service';
import { Component, OnInit } from '@angular/core';
import { LanguageDoc, LanguageModel } from '../display-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { TranslatePipe } from '@ngx-translate/core';
import { DisplayLanguagesEditComponent } from './display-languages-edit/display-languages-edit.component';

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
  imports: [TranslatePipe, DisplayLanguagesEditComponent],
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

  showEditModal = false;
  selectedDoc: LanguageDoc | null = null;

  constructor(private languageService: LanguagesService){}

  /**
   * Fetches all language documents on init and builds the UI model.
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.languages = await this.languageService.getLanguages();
    } catch (error) {
      console.error('Error fetching languages', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  //TODO: Implement disableLanguage
  async disableLanguage(doc: LanguageDoc): Promise<void> {

  }

  //TODO: Implement enableLanguage
  async enableLanguage(doc: LanguageDoc): Promise<void> {

  }

  //TODO: Implement editLanguage
  async editLanguage(doc: LanguageDoc): Promise<void> {
    this.selectedDoc = doc;
    this.showEditModal = true;
  }

  //TODO: Implement uploadLanguage
  async uploadLanguage(doc: LanguageDoc): Promise<void> {

  }

  //TODO: Implement deleteLanguage
  async deleteLanguage(doc: LanguageDoc): Promise<void> {

  }

  //TODO: Implement addLanguage
  async addLanguage(): Promise<void> {
    this.selectedDoc = null;
    this.showEditModal = true;
  }
}
