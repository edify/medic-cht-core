/**
 * Tracks the state of the save operation.
 * Controls visibility of the loader, success, and error messages in the template.
 */
export interface ResponseStatus {
  loading?: boolean;
  state?: 'success' | 'error' | '';
  msg?: string;
}
