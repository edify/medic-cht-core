export interface SmsSettingsModel {
  gateway_number: string;
  schedule_morning_hours: number;
  schedule_morning_minutes: number;
  schedule_evening_hours: number;
  schedule_evening_minutes: number;
  outgoing_phone_replace: { match?: string; replace?: string };
  accept_messages: boolean;
}

export interface SmsSettingsErrors {
  gateway_number?: string;
  messaging_window?: string;
}

export interface TimeOption {
  name: string;
  value: number;
}
