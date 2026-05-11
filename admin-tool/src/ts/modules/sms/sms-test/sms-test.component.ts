import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { SmsTestErrors } from './sms-test-interfaces';

@Component({
  selector: 'sms-test',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sms-test.component.html',
})
export class SmsTestComponent {

  /** The message body to send */
  message = '';

  /** The sender phone number */
  from = '';

  /** Validation errors for the form fields */
  errors: SmsTestErrors = {};

  /** Controls the disabled state of the Send Message button */
  saving = false;

  /** True when the message was sent successfully */
  success = false;

  /** True when the message failed to send */
  failure = false;

  constructor(private readonly http: HttpClient) {}

  /**
   * Validates the form, sends the test SMS via the API,
   * and updates the success or failure state accordingly.
   */
  submit(): void {
    this.success = false;
    this.failure = false;

    if (!this.validate()) {
      return;
    }

    this.saving = true;
    this.send()
      .then(() => {
        this.success = true;
        this.saving = false;
      })
      .catch(err => {
        this.failure = true;
        this.saving = false;
        console.error('Error submitting message', err);
      });
  }

  /**
   * Validates that message and from fields are not empty.
   * Populates the errors object with translation keys for any missing fields.
   *
   * @returns {boolean} true if the form is valid
   */
  private validate(): boolean {
    this.errors = {};
    if (!this.message) {
      this.errors.message = 'validate.required';
    }
    if (!this.from) {
      this.errors.from = 'validate.required';
    }
    return !this.errors.message && !this.errors.from;
  }

  /**
   * Sends the test SMS to the CHT API.
   * Posts to /api/v2/records with form-encoded body.
   *
   * @returns {Promise<void>}
   */
  private send(): Promise<void> {
    const body = new HttpParams()
      .set('message', this.message)
      .set('from', this.from);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post('/api/v2/records', body.toString(), { headers })
      .toPromise()
      .then(() => undefined);
  }
}
