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

/**
 * The full header tabs configuration map as stored in settings.header_tabs.
 * The key is the tab name (e.g. 'messages', 'tasks').
 * Only tabs that have been configured at least once appear as keys.
 *
 * Example:
 * {
 *   messages: { icon: 'fa-envelope', resource_icon: 'icon-pregnancy' },
 *   tasks:    { icon: '', resource_icon: '' }
 * }
 */
export type HeaderTabsMap = Record<string, HeaderTabConfig>;

/**
 * Represents a navigation tab in the CHT application header.
 * Used in the admin tool to display and configure tab icons.
 * name is the key used in settings.header_tabs.
 * translation is the i18n key shown in the tab column.
 * defaultIcon is the FontAwesome class used by default when no custom icon is configured.
 */
export interface HeaderTab {
  name: string;
  translation: string;
  defaultIcon: string;
}

/**
 * Represents the icon configuration for a single navigation tab
 * as stored in settings.header_tabs.
 * icon is a FontAwesome class (e.g. 'fa-envelope') set by the administrator.
 * resource_icon is the name of an SVG resource from the resources document.
 * Empty string means no custom configuration — the app uses the default.
 */
export interface HeaderTabConfig {
  icon: string;
  resource_icon: string;
}
