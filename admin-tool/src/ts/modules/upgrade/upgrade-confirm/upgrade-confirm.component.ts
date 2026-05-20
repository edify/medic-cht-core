import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Build } from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { BytesPipe } from '@admin-tool-modules/bytes.pipe';

/**
 * Modal component for confirming a stage, install or abort upgrade action.
 *
 * Controlled by the parent via the visible input.
 * When isAbort is false, displays the current and target versions and indexing
 * requirements if available, with stage or install specific text.
 * When isAbort is true, displays a cancellation confirmation with the current
 * and target versions of the upgrade being cancelled.
 * Executes the confirmCallback provided by the parent when the user confirms.
 * Emits closed when the modal is dismissed or the action completes.
 * Emits errorOccurred with the errorKey translation key if the action fails.
 *
 * Part of the Upgrade module.
 */
@Component({
  selector: 'upgrade-confirm',
  imports: [TranslatePipe, BytesPipe],
  templateUrl: './upgrade-confirm.component.html',
  styleUrl: './upgrade-confirm.component.less'
})
export class UpgradeConfirmComponent implements OnChanges {

  /** Controls visibility of the modal */
  @Input() visible = false;

  /** When true shows stage-specific text, when false shows install-specific text. Only used when isAbort is false */
  @Input() stageOnly = false;

  /** The build being staged or installed, used to display indexing requirements. Only used when isAbort is false */
  @Input() build: Build | null = null;

  /** The currently running version shown in the confirmation summary */
  @Input() before = '';

  /** The target version shown in the confirmation summary */
  @Input() after = '';

   /** When true shows abort-specific text and danger button styling, when false shows stage or install confirmation */
  @Input() isAbort = false;

  /** The function to execute when the user confirms, provided by the parent */
  @Input() confirmCallback: (() => Promise<void>) | null = null;

  /** Translation key for the error message emitted when the action fails */
  @Input() errorKey = 'instance.upgrade.error.deploy';

  /** Emitted when the modal is dismissed or the action completes */
  @Output() closed = new EventEmitter<void>();

  /** Emitted with the errorKey translation key when the action fails */
  @Output() errorOccurred = new EventEmitter<string>();

  /** Controls the disabled state of the modal buttons while the action is in progress */
  loadingModalState = false;

  constructor() {}

  /**
   * Resets the modal state when it becomes visible.
   * Clears the loading state on every open.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.loadingModalState = false;
    }
  }

  /**
   * Executes the confirmCallback provided by the parent.
   * Sets loadingModalState to true while the action is in progress.
   * Emits closed on success.
   * Emits errorOccurred with the errorKey and closed if the action fails.
   *
   * @returns {Promise<void>}
   */
  async submit(): Promise<void> {
    if (!this.confirmCallback) {
      return;
    }
    this.loadingModalState = true;

    try {
      await this.confirmCallback();
      this.closed.emit();
    } catch (error) {
      console.error('Error when confirming', error);
      this.errorOccurred.emit(this.errorKey);
      this.closed.emit();
    }
  }

  /**
   * Dismisses the modal without executing the action by emitting the closed event.
   */
  cancel(): void {
    this.closed.emit();
  }
}
