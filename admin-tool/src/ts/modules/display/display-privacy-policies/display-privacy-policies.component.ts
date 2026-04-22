import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguagesService } from '@admin-tool-services/languages.service';
import { PrivacyPolicyRow, PrivacyPoliciesDoc } from '../display-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { DecimalPipe } from '@angular/common';

/**
 * Component for managing privacy policy HTML documents for each application language.
 * Loads all available languages and their corresponding privacy policies from CouchDB on init.
 * Displays a table with one row per language showing the current policy and an upload area.
 * Allows the administrator to stage new HTML files, delete existing policies,
 * and save all changes in a single submit operation.
 */
@Component({
  selector: 'display-privacy-policies',
  imports: [FormsModule, TranslatePipe, DecimalPipe],
  templateUrl: './display-privacy-policies.component.html',
  styleUrl: './display-privacy-policies.component.less'
})
export class DisplayPrivacyPoliciesComponent implements OnInit {

  /** List of rows for the privacy policies table, one per available application language */
  privacyPolicyRows: PrivacyPolicyRow[] = [];

  /** Controls visibility of the loader while languages and policies are being fetched */
  loadingPageStatus = false;

  /** Tracks the state of the submit operation for loading, success and error feedback */
  responseStatus: ResponseStatus = {};

  /** The privacy-policies document loaded from CouchDB, used during submit to build the updated doc */
  privacyPoliciesDoc: PrivacyPoliciesDoc | null = null;

  /** Language codes whose current policies are pending deletion on the next submit */
  languagePolicyDeletes: string[] = [];

  constructor(private languagesService: LanguagesService) {}

  /**
   * Loads all language documents and the privacy-policies document from CouchDB on init.
   * Builds the privacyPolicyRows array combining each language with its corresponding attachment.
   * Sets attachment to null for languages that do not have a policy saved yet.
   *
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;

    try {
      const languageDocs = await this.languagesService.getLanguageDocs();
      const privacyPoliciesDoc = await this.languagesService.getPrivacyPoliciesDoc(true);

      this.privacyPoliciesDoc = privacyPoliciesDoc;
      this.privacyPolicyRows = languageDocs.map(doc => ({
        code: doc.code,
        name: doc.name,
        attachment: privacyPoliciesDoc._attachments[privacyPoliciesDoc.privacy_policies[doc.code]] ?? null,
        stagedFile: null
      }));
    } catch (error) {
      console.error('Error loading languages and privacy policies', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  /**
   * Captures the file selected by the user from the file input and stages it in the corresponding row.
   * Does not save to CouchDB — the file is stored in stagedFile until submit is called.
   *
   * @param {string} code - the language code of the row whose file input changed
   * @param {Event} event - the change event from the file input
   */
  onFileSelected(code: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const row = this.privacyPolicyRows.find(privacyPolicyRow => privacyPolicyRow.code === code);
    if (row) {
      row.stagedFile = file;
    }
  }

  /**
   * Marks the current saved policy for a language as pending deletion.
   * Clears the attachment from the row so it disappears from the UI immediately.
   * The actual deletion from CouchDB occurs when submit is called.
   *
   * @param {string} code - the language code of the policy to delete
   */
  deletePolicy(code: string): void {
    const row = this.privacyPolicyRows.find(privacyPolicyRow => privacyPolicyRow.code === code);
    if (row) {
      row.attachment = null;
      this.languagePolicyDeletes.push(code);
    }
  }

  //TODO
  deleteUpdate(code: string): void {}
  //TODO
  submit(): void {}

  
}
