import { SettingsService } from '@admin-tool-services/settings.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';

@Component({
  selector: 'display.date.time',
  imports: [FormsModule],
  templateUrl: './display.date.time.component.html',
  styleUrl: './display.date.time.component.less',
})
export class DisplayDateTimeComponent implements OnInit {
  standardDateFormats: string[] = ['DD-MMM-YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY'];

  standardDatetimeFormats: string[] = ['DD-MMM-YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm:ss', 'MM/DD/YYYY HH:mm:ss'];

  dateFormatSelection!: string;
  dateTimeFormatSelection!: string;
  dateFormatExample!: string;
  dateTimeFormatExample!: string;

  responseStatus: {
    loading?: boolean;
    success?: boolean;
    error?: boolean;
    msg?: string;
  } = {};

  constructor(private settingsService: SettingsService) {}

  async ngOnInit(): Promise<void> {
    try {
      const settings = await this.settingsService.getDateTimeSettings();
      this.dateFormatSelection = this.resolveDateFormat(settings.dateFormat, this.standardDateFormats);
      this.dateTimeFormatSelection = this.resolveDateFormat(settings.dateTimeFormat, this.standardDatetimeFormats);
      this.dateFormatExample = moment().format(this.dateFormatSelection);
      this.dateTimeFormatExample = moment().format(this.dateTimeFormatSelection);
    } catch (error) {
      console.error('Error getting settings', error);
    }
  }

  private isValidMomentDateFormat(format: string): boolean {
    if (!format || !format.trim()) {
      return false;
    }

    const formatted = moment().format(format);

    if (formatted === format) {
      return false;
    }
    return formatted !== 'Invalid date' && moment(formatted, format, true).isValid();
  }

  private resolveDateFormat(format: string, standardFormats: string[]): string {
    if (format && this.isValidMomentDateFormat(format)) {
      if (!standardFormats.includes(format)) {
        standardFormats.push(format);
      }
      return format;
    }
    return standardFormats[0];
  }

  onDateFormatSelected(date: string) {
    this.dateFormatSelection = date;
    this.dateFormatExample = moment().format(this.dateFormatSelection);
  }
  onDateTimeFormatSelected(date: string) {
    this.dateTimeFormatSelection = date;
    this.dateTimeFormatExample = moment().format(this.dateTimeFormatSelection);
  }

  async setSettingsDate(): Promise<void> {
    this.responseStatus = { loading: true };

    try {
      await this.settingsService.updateDateTimeSettings({
        dateFormat: this.dateFormatSelection,
        dateTimeFormat: this.dateTimeFormatSelection,
      });

      this.responseStatus = { success: true, msg: 'Settings updated successfully' };
      setTimeout(() => {
        if (this.responseStatus.success) {
          this.responseStatus = {};
        }
      }, 3000);
    } catch (error) {
      console.error('Error updating settings', error);
      this.responseStatus = { error: true, msg: 'Error updating settings' };
    }
  }
}
