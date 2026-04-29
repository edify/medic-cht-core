import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SettingsService } from '@admin-tool-services/settings.service';
import { CountriesService } from '@admin-tool-services/countries.service';
import { Select2SearchService } from '@admin-tool-services/select2search.service';

import {
  SmsSettingsModel,
  SmsSettingsErrors,
  TimeOption,
} from './sms-settings-interfaces';

const phoneNumber = require('@medic/phone-number');

declare const $: any;

const MINUTES_PER_HOUR = 60;

@Component({
  selector: 'mm-sms',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sms-settings.component.html',
})
export class SmsSettingsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('countryCodeSelect')
  countryCodeRef!: ElementRef<HTMLSelectElement>;

  @ViewChild('outgoingPhoneMatch')
  outgoingPhoneMatchRef!: ElementRef<HTMLSelectElement>;

  /** Form model representing the SMS settings fields */
  model: SmsSettingsModel = {
    gatewayNumber: '',
    scheduleMorningHours: 0,
    scheduleMorningMinutes: 0,
    scheduleEveningHours: 0,
    scheduleEveningMinutes: 0,
    outgoingPhoneReplace: {},
    acceptMessages: false,
  };

  /** Validation errors for the SMS settings form */
  errors: SmsSettingsErrors = {};

  /** Options for the hours dropdowns (0-23) */
  hours: TimeOption[] = [];

  /** Options for the minutes dropdowns (every 5 minutes) */
  minutes: TimeOption[] = [];

  /** Tracks the state of save operations for the submit action */
  status: {
    loading?: boolean;
    success?: boolean;
    error?: boolean;
    msg?: string;
  } = {};

  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly countriesService: CountriesService,
    private readonly select2SearchService: Select2SearchService,
    private readonly translateService: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  /**
   * Validates the form and submits the SMS settings to the API.
   * Maps camelCase model fields back to snake_case API fields.
   */
  submit(): void {
    this.errors = {};
    if (!this.validate()) {
      return;
    }

    const settings = {
      gateway_number: this.model.gatewayNumber,
      default_country_code: $(this.countryCodeRef.nativeElement).val(),
      forms_only_mode: !this.model.acceptMessages,
      schedule_morning_hours: this.model.scheduleMorningHours,
      schedule_morning_minutes: this.model.scheduleMorningMinutes,
      schedule_evening_hours: this.model.scheduleEveningHours,
      schedule_evening_minutes: this.model.scheduleEveningMinutes,
      outgoing_phone_replace: {
        match: $(this.outgoingPhoneMatchRef.nativeElement).val(),
        replace: this.model.outgoingPhoneReplace.replace,
      },
    };

    this.status = { loading: true };

    this.settingsService
      .updateSettings(settings)
      .then(() => {
        this.status = {
          success: true,
          msg: this.translateService.instant('Saved'),
        };
        this.successTimeout = setTimeout(() => {
          this.status = { ...this.status, success: false };
        }, 3000);
      })
      .catch((err) => {
        console.error('Error updating settings', err);
        this.status = {
          error: true,
          msg: this.translateService.instant('Error saving settings'),
        };
      });
  }

  /**
   * Validates the messaging window times and gateway number.
   * Morning time must be earlier than evening time.
   * Gateway number must be a valid phone number if provided.
   *
   * @returns {boolean} true if the form is valid
   */
  private validate(): boolean {
    const morning =
      this.model.scheduleMorningHours * MINUTES_PER_HOUR +
      this.model.scheduleMorningMinutes;
    const evening =
      this.model.scheduleEveningHours * MINUTES_PER_HOUR +
      this.model.scheduleEveningMinutes;

    if (morning >= evening) {
      this.errors.messagingWindow = this.translateService.instant(
        'The first time must be earlier than the second time',
      );
      return false;
    }

    const gatewayNumber = this.model.gatewayNumber;
    if (gatewayNumber) {
      const info = {
        default_country_code: $(this.countryCodeRef.nativeElement).val(),
        phone_validation: 'none',
      };
      if (!phoneNumber.validate(info, gatewayNumber)) {
        this.errors.gatewayNumber = this.translateService.instant(
          'Phone number not valid',
        );
        return false;
      }
      this.model.gatewayNumber = phoneNumber.normalize(info, gatewayNumber);
    }

    return true;
  }

  /**
   * Generates an array of time options for use in hour or minute dropdowns.
   * Values are padded with a leading zero when below 10.
   *
   * @param {number} max - the exclusive upper bound
   * @param {number} increment - step between values, defaults to 1
   * @returns {TimeOption[]}
   */
  private generateTimeModels(max: number, increment = 1): TimeOption[] {
    const result: TimeOption[] = [];
    for (let i = 0; i < max; i += increment) {
      result.push({ name: (i < 10 ? '0' : '') + i, value: i });
    }
    return result;
  }

  /**
   * Fetches SMS settings from the API and populates the form model.
   * Maps snake_case API fields to camelCase model properties.
   * Initialises the country code Select2 dropdowns after settings load.
   */
  private loadSettings(): void {
    this.settingsService
      .get()
      .then((res) => {
        this.model = {
          gatewayNumber: res.gateway_number || '',
          scheduleMorningHours: res.schedule_morning_hours ?? 0,
          scheduleMorningMinutes: res.schedule_morning_minutes ?? 0,
          scheduleEveningHours: res.schedule_evening_hours ?? 0,
          scheduleEveningMinutes: res.schedule_evening_minutes ?? 0,
          outgoingPhoneReplace: res.outgoing_phone_replace || {},
          acceptMessages: !res.forms_only_mode,
        };

        this.hours = this.generateTimeModels(24);
        this.minutes = this.generateTimeModels(MINUTES_PER_HOUR, 5);

        this.initSelect2Dropdowns(
          res.default_country_code,
          res.outgoing_phone_replace?.match,
        );
      })
      .catch((err) => console.error('Error loading settings', err));
  }

  /**
   * Initialises the country code Select2 dropdowns once Select2 is available.
   * Polls every 100ms if Select2 has not yet attached to jQuery.
   *
   * @param {string} defaultCountryCode - the currently saved default country code
   * @param {string} outgoingMatch - the currently saved outgoing phone match value
   */
  private initSelect2Dropdowns(
    defaultCountryCode?: string,
    outgoingMatch?: string,
  ): void {
    if (!$.fn.select2) {
      setTimeout(
        () => this.initSelect2Dropdowns(defaultCountryCode, outgoingMatch),
        100,
      );
      return;
    }

    const countryList = this.countriesService.list;

    this.select2SearchService.initStaticSelect(
      this.countryCodeRef.nativeElement,
      countryList,
      { width: '20em', initialValue: defaultCountryCode },
    );

    this.select2SearchService.initStaticSelect(
      this.outgoingPhoneMatchRef.nativeElement,
      countryList,
      {
        width: '20em',
        placeholder: ' ',
        allowClear: true,
        initialValue: outgoingMatch,
      },
    );
  }
}
