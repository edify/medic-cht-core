import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/**
 * Interface representing the date and datetime display format settings.
 */
export interface DateTimeSettings {
  dateFormat: string;
  dateTimeFormat: string;
}

/**
 * Service responsible for reading and writing CHT instance settings
 * via the /api/v1/settings endpoint.
 *
 * All HTTP calls include withCredentials: true so the session cookie
 * is forwarded automatically.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  /**
   * Fetches the full settings object from the API.
   * Returns a raw object since the settings schema is open-ended
   * and each domain-specific method is responsible for extracting
   * and typing the fields it needs.
   *
   * @returns {Promise<any>} the complete settings object from /api/v1/settings
   */
  async getSettings(): Promise<any> {
    return firstValueFrom(
      this.http.get('/api/v1/settings', {
        withCredentials: true,
      }),
    );
  }

  /**
   * Sends a partial or full settings update to the API.
   * By default performs a partial update (replace=false), meaning only
   * the provided keys are overwritten and the rest of the settings are preserved.
   * Set replace=true to replace the entire settings object.
   *
   * @param {Record<string, any>} updates - key/value pairs to update in settings
   * @param {boolean} replace - if true, replaces all settings instead of merging. Defaults to false.
   * @returns {Promise<void>}
   */
  async updateSettings(updates: Record<string, any>, replace = false): Promise<void> {
    return firstValueFrom(
      this.http.put<void>('/api/v1/settings', updates, {
        params: { replace: String(replace) },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }),
    );
  }

  /**
   * Retrieves the date and datetime display formats from settings,
   * mapping the API's snake_case fields (date_format, reported_date_format)
   * to the DateTimeSettings model.
   *
   * @returns {Promise<DateTimeSettings>}
   */
  async getDateTimeSettings(): Promise<DateTimeSettings> {
    const res = await this.getSettings();
    return {
      dateFormat: res.date_format,
      dateTimeFormat: res.reported_date_format,
    };
  }

  /**
   * Persists the date and datetime display formats to the API,
   * mapping camelCase model fields back to the API's snake_case keys.
   *
   * @param {DateTimeSettings} changes - the new date and datetime formats to save
   * @returns {Promise<void>}
   */
  async updateDateTimeSettings(changes: DateTimeSettings): Promise<void> {
    return this.updateSettings({
      date_format: changes.dateFormat,
      reported_date_format: changes.dateTimeFormat,
    });
  }
}
