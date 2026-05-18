import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsService } from '@admin-tool-services/settings.service';

const moment = require('moment');

interface BackupStatus {
  uploading: boolean;
  error?: boolean;
  success?: boolean;
}

interface BackupDownload {
  name: string;
  url: string;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './backup.component.html',
})
export class BackupComponent implements AfterViewInit, OnDestroy {

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  /** Download link data for the settings backup JSON */
  backup: BackupDownload = { name: '', url: '' };

  /** Tracks the state of the restore upload operation */
  status: BackupStatus = { uploading: false };

  private changeHandler = (event: Event) => this.upload(event);

  constructor(private readonly settingsService: SettingsService) {}

  ngAfterViewInit(): void {
    this.fileInputRef.nativeElement.addEventListener('change', this.changeHandler);
    this.loadBackup();
  }

  ngOnDestroy(): void {
    this.fileInputRef?.nativeElement?.removeEventListener('change', this.changeHandler);
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
   * Fetches the current settings from the API and generates
   * a downloadable JSON backup file with a date-stamped filename.
   */
  private loadBackup(): void {
    this.settingsService.get()
      .then(settings => {
        const json = JSON.stringify(settings, null, 4); 
        const blob = new Blob([json], { type: 'application/json' });
        this.backup = {
          name: 'settings_' + moment().format('YYYY-MM-DD') + '.json',
          url: URL.createObjectURL(blob),
        };
      })
      .catch(err => console.error('Error fetching settings', err));
  }

  /**
   * Handles the file input change event.
   * Reads the selected JSON file, parses it as settings,
   * and restores them via updateSettings with replace=true.
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
        const settings = JSON.parse(reader.result as string);
        this.settingsService.updateSettings(settings, true)
          .then(() => {
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
