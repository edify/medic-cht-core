import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DateTimeSettings {
  dateFormat: string;
  dateTimeFormat: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  async getSettings(): Promise<any> {
    return firstValueFrom(
      this.http.get('/api/v1/settings', {
        withCredentials: true,
      }),
    );
  }

  async updateSettings(updates: Record<string, any>, replace = false): Promise<void> {
    return firstValueFrom(
      this.http.put<void>('/api/v1/settings', updates, {
        params: { replace: String(replace) },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }),
    );
  }

  async getDateTimeSettings(): Promise<DateTimeSettings> {
    const res = await this.getSettings();
    return {
      dateFormat: res.date_format,
      dateTimeFormat: res.reported_date_format,
    };
  }

  async updateDateTimeSettings(changes: DateTimeSettings): Promise<void> {
    return this.updateSettings({
      date_format: changes.dateFormat,
      reported_date_format: changes.dateTimeFormat,
    });
  }
}
