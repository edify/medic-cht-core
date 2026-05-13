export interface SmsForm {
  meta: {
    code: string;
    icon?: string;
    translation_key?: string;
    label?: Record<string, string>;
  };
  [key: string]: unknown;
}

export interface SmsFormsDownload {
  name: string;
  url: string;
}

export interface SmsFormsStatus {
  uploading: boolean;
  error?: boolean;
  success?: boolean;
}
