import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { SettingsService } from '@admin-tool-services/settings.service';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';

import { SmsForm, SmsFormsDownload, SmsFormsStatus } from './sms-forms-interfaces';

const moment = require('moment');

@Component({
  selector: 'sms-forms',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './sms-forms.component.html',
  styleUrl: './sms-forms.component.less',
})
export class SmsFormsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  /** Map of installed SMS forms keyed by form code */
  forms: Record<string, SmsForm> = {};

  /** Download link data for the installed forms JSON */
  download: SmsFormsDownload = { name: '', url: '' };

  /** Tracks the state of the upload operation */
  status: SmsFormsStatus = { uploading: false };

  /** Resources document used to resolve icon content for display */
  resourcesDoc: ResourcesDoc | null = null;

  private changeHandler = (event: Event) => this.upload(event);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly resourcesService: ResourcesService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngAfterViewInit(): void {
    this.fileInputRef.nativeElement.addEventListener('change', this.changeHandler);
    this.loadForms();
    this.loadResources();
  }

  ngOnDestroy(): void {
    this.fileInputRef?.nativeElement?.removeEventListener('change', this.changeHandler);
  }

  /** Returns the installed forms as an array for template iteration */
  get formsList(): SmsForm[] {
    return Object.values(this.forms);
  }

  /**
   * Triggers the hidden file input click to open the file picker.
   *
   * @param {Event} event - the click event from the choose button
   */
  onChooseClick(event: Event): void {
    event.preventDefault();
    this.fileInputRef.nativeElement.click();
  }

  /**
   * Resolves the icon content for a given icon name using the resources document.
   * Returns empty content if the resources document has not loaded yet
   * or if the icon name is empty.
   * Applies bypassSecurityTrustHtml for SVG icons to allow inline rendering.
   *
   * @param {string} iconName - the icon name as stored in the resources document
   * @returns {{ isSvg: boolean; content: string | SafeHtml }}
   */
  getIconContent(iconName?: string): { isSvg: boolean; content: string | SafeHtml } {
    if (!this.resourcesDoc || !iconName) {
      return { isSvg: false, content: '' };
    }
    const result = this.resourcesService.getIconContent(iconName, this.resourcesDoc);
    if (result.isSvg) {
      return {
        isSvg: true,
        content: this.sanitizer.bypassSecurityTrustHtml(result.content),
      };
    }
    return result;
  }

  /**
   * Loads the installed SMS forms from settings and generates the download link.
   */
  private loadForms(): void {
    this.settingsService.get()
      .then(settings => {
        this.forms = (settings as any).forms || {};
        this.download = this.generateDownload(this.forms);
      })
      .catch(err => console.error('Error fetching settings', err));
  }

  /**
   * Loads the resources document from CouchDB for icon rendering.
   */
  private loadResources(): void {
    this.resourcesService.getResources()
      .then(doc => this.resourcesDoc = doc)
      .catch(err => console.error('Error fetching resources', err));
  }

  /**
   * Generates the download link for the installed forms as a JSON file.
   *
   * @param {Record<string, SmsForm>} forms - the installed forms map
   * @returns {SmsFormsDownload} the download name and object URL
   */
  private generateDownload(forms: Record<string, SmsForm>): SmsFormsDownload {
    const json = JSON.stringify(Object.values(forms));
    const blob = new Blob([json], { type: 'application/json' });
    return {
      name: 'forms_' + moment().format('YYYY-MM-DD') + '.json',
      url: URL.createObjectURL(blob),
    };
  }

  /**
   * Handles the file input change event.
   * Reads the selected JSON file, parses the forms, saves them to settings,
   * and reloads the forms list on success.
   *
   * @param {Event} event - the change event from the file input
   */
  private upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      this.uploadFinished(new Error('File not found'));
      return;
    }

    this.status = { uploading: true, error: false, success: false };

    const file = files[0];
    const reader = new FileReader();

    reader.addEventListener('loadend', () => {
      try {
        const json: SmsForm[] = JSON.parse(reader.result as string);
        const forms: Record<string, SmsForm> = {};

        json.forEach(form => {
          if (form.meta?.code) {
            forms[form.meta.code.toUpperCase()] = form;
          }
        });

        this.settingsService.updateSettings({ forms }, true)
          .then(() => {
            this.forms = forms;
            this.download = this.generateDownload(forms);
            input.value = '';
            this.uploadFinished();
          })
          .catch(err => this.uploadFinished(err));
      } catch (err) {
        this.uploadFinished(err as Error);
      }
    });

    reader.addEventListener('error', () => this.uploadFinished(reader.error as Error));
    reader.readAsText(file);
  }

  /**
   * Finalises the upload operation, setting the success or error status.
   *
   * @param {Error} err - the error if upload failed, undefined on success
   */
  private uploadFinished(err?: Error | null): void {
    if (err) {
      console.error('Upload failed', err);
    }
    this.status = {
      uploading: false,
      error: !!err,
      success: !err,
    };
  }
}
