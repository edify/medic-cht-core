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

@Component({
  selector: 'sms-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sms-settings.component.html',
})
export class SmsSettingsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('countryCodeSelect')
  countryCodeRef!: ElementRef<HTMLSelectElement>;

  @ViewChild('outgoingPhoneMatch')
  outgoingPhoneMatchRef!: ElementRef<HTMLSelectElement>;

  model: SmsSettingsModel = {
    gateway_number: '',
    schedule_morning_hours: 0,
    schedule_morning_minutes: 0,
    schedule_evening_hours: 0,
    schedule_evening_minutes: 0,
    outgoing_phone_replace: {},
    accept_messages: false,
  };

  errors: SmsSettingsErrors = {};
  hours: TimeOption[] = [];
  minutes: TimeOption[] = [];
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

  submit(): void {
    this.errors = {};
    if (!this.validate()) {
      return;
    }

    const settings = {
      gateway_number: this.model.gateway_number,
      default_country_code: $(this.countryCodeRef.nativeElement).val(),
      forms_only_mode: !this.model.accept_messages,
      schedule_morning_hours: this.model.schedule_morning_hours,
      schedule_morning_minutes: this.model.schedule_morning_minutes,
      schedule_evening_hours: this.model.schedule_evening_hours,
      schedule_evening_minutes: this.model.schedule_evening_minutes,
      outgoing_phone_replace: {
        match: $(this.outgoingPhoneMatchRef.nativeElement).val(),
        replace: this.model.outgoing_phone_replace.replace,
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

  private validate(): boolean {
    const morning =
      this.model.schedule_morning_hours * 60 +
      this.model.schedule_morning_minutes;
    const evening =
      this.model.schedule_evening_hours * 60 +
      this.model.schedule_evening_minutes;

    if (morning >= evening) {
      this.errors.messaging_window = this.translateService.instant(
        'The first time must be earlier than the second time',
      );
      return false;
    }

    const gatewayNumber = this.model.gateway_number;
    if (gatewayNumber) {
      const info = {
        default_country_code: $(this.countryCodeRef.nativeElement).val(),
        phone_validation: 'none',
      };
      if (!phoneNumber.validate(info, gatewayNumber)) {
        this.errors.gateway_number = this.translateService.instant(
          'Phone number not valid',
        );
        return false;
      }
      this.model.gateway_number = phoneNumber.normalize(info, gatewayNumber);
    }

    return true;
  }

  private generateTimeModels(max: number, increment = 1): TimeOption[] {
    const result: TimeOption[] = [];
    for (let i = 0; i < max; i += increment) {
      result.push({ name: (i < 10 ? '0' : '') + i, value: i });
    }
    return result;
  }

  private loadSettings(): void {
    this.settingsService
      .get()
      .then((res) => {
        this.model = {
          gateway_number: res.gateway_number || '',
          schedule_morning_hours: res.schedule_morning_hours ?? 0,
          schedule_morning_minutes: res.schedule_morning_minutes ?? 0,
          schedule_evening_hours: res.schedule_evening_hours ?? 0,
          schedule_evening_minutes: res.schedule_evening_minutes ?? 0,
          outgoing_phone_replace: res.outgoing_phone_replace || {},
          accept_messages: !res.forms_only_mode,
        };

        this.hours = this.generateTimeModels(24);
        this.minutes = this.generateTimeModels(60, 5);

        this.initSelect2Dropdowns(
          res.default_country_code,
          res.outgoing_phone_replace?.match,
        );
      })
      .catch((err) => console.error('Error loading settings', err));
  }

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
