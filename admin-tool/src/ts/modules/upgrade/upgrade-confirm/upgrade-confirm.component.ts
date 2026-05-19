import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { Build } from '@admin-tool-modules/upgrade/upgrade-interfaces';
import { BytesPipe } from '@admin-tool-modules/bytes.pipe';


@Component({
  selector: 'upgrade-confirm',
  imports: [TranslatePipe, BytesPipe],
  templateUrl: './upgrade-confirm.component.html',
  styleUrl: './upgrade-confirm.component.less'
})
export class UpgradeConfirmComponent implements OnChanges {

  @Input() visible = false;
  @Input() stageOnly = false;
  @Input() build: Build | null = null;
  @Input() before = '';
  @Input() after = '';
  @Input() confirmCallback: (() => Promise<void>) | null = null;
  @Input() errorKey = 'instance.upgrade.error.deploy';
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
      console.error('Error when confirming', error);
      this.responseStatus = { state: 'error', msg: this.errorKey };
      this.loadingModalState = false;
    }
  }

  cancel(): void {
    this.closed.emit();
  }
}
