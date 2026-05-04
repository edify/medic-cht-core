export interface SmsSettingsModel {
  gatewayNumber: string;
  scheduleMorningHours: number;
  scheduleMorningMinutes: number;
  scheduleEveningHours: number;
  scheduleEveningMinutes: number;
  outgoingPhoneReplace: { match?: string; replace?: string };
  acceptMessages: boolean;
}

export interface SmsSettingsErrors {
  gatewayNumber?: string;
  messagingWindow?: string;
}

export interface TimeOption {
  name: string;
  value: number;
}
