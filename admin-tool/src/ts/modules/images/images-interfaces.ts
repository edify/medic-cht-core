/**
 * Represents a single image attachment in the branding document.
 * data is only present when the document is fetched with attachments: true.
 * When writing via put, data can be a File object — PouchDB handles the conversion to base64.
 */
export interface BrandingAttachment {
  content_type: string;
  data?: string | File;
}

/**
 * Represents the branding document as stored in CouchDB.
 * Contains the application title, a map of logical image names to attachment
 * filenames, and the attachments themselves.
 * resources maps logical names (logo, favicon, icon) to their attachment filenames.
 */
export interface BrandingDoc {
  _id: string;
  title: string;
  resources: Record<string, string>;
  _attachments: Record<string, BrandingAttachment>;
  _rev?: string;
}

/**
 * Represents the partners document as stored in CouchDB.
 * Contains a map of partner names to attachment filenames and the attachments themselves.
 * resources maps partner names (e.g. 'apple') to their attachment filenames (e.g. 'apple-logo.png').
 * If the document does not exist in CouchDB, an empty doc is returned instead of throwing.
 */
export interface PartnersDoc {
  _id: string;
  resources: Record<string, string>;
  _attachments: Record<string, BrandingAttachment>;
  _rev?: string;
}

export type HeaderTabsMap = Record<string, HeaderTabConfig>;

export interface HeaderTab {
  name: string;
  translation: string;
  defaultIcon: string;
}

export interface HeaderTabConfig {
  icon: string;
  resource_icon: string;
}
