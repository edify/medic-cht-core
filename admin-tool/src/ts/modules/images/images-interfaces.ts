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