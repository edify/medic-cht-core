import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';

@Component({
  selector: 'upgrade-abort',
  imports: [TranslatePipe],
  templateUrl: './upgrade-abort.component.html',
  styleUrl: './upgrade-abort.component.less'
})
export class UpgradeAbortComponent implements OnChanges {

  @Input() visible = false;
  @Input() before = '';
  @Input() after = '';
  @Input() confirmCallback: (() => Promise<void>) | null = null;

  @Output() closed = new EventEmitter<void>();

  responseStatus: ResponseStatus = {};
  loadingModalState = false;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.responseStatus = {};
      this.loadingModalState = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.confirmCallback) {
      return;
    }

    this.loadingModalState = true;
    this.responseStatus = {};

    try {
      await this.confirmCallback();
      this.closed.emit();
    } catch (error) {
      console.error('Error when aborting upgrade', error);
      this.responseStatus = { state: 'error', msg: 'instance.upgrade.error.abort' };
      this.loadingModalState = false;
    }
  }

  cancel(): void {
    this.closed.emit();
  }


}
