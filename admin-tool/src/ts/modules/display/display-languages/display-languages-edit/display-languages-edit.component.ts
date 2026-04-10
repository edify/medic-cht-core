import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguagesService } from '@admin-tool-services/languages.service';
import { LanguageDoc, LanguageValidation } from '../../display-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';

@Component({
  selector: 'display-languages-edit',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './display-languages-edit.component.html',
  styleUrl: './display-languages-edit.component.less'
})
export class DisplayLanguagesEditComponent implements OnChanges {
  @Input() visible = false;
  @Input() doc: LanguageDoc | null=null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LanguageDoc>();

  model: Partial<LanguageDoc> = {
    code: '',
    name: '',
    rtl: false,
  };
  languageErrors: LanguageValidation = {};
  loadingModalState = false;
  responseStatus: ResponseStatus = {};

  constructor(private languagesService: LanguagesService, private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['visible']?.currentValue === true){
      if(this.doc){
        this.model = { code: this.doc.code, name: this.doc.name, rtl: this.doc.rtl ?? false };
      } else{
        this.model = { code: '', name: '', rtl: false };
      }
      this.languageErrors = {};
      this.loadingModalState = false;
    }
  }
  private validate(): boolean {
    this.languageErrors = {};
    
    if(!this.model.code) {
      this.languageErrors.code = this.translate.instant('field is required', {
        field: this.translate.instant('Language code')
      });
    }
    if(!this.model.name) {
      this.languageErrors.name = this.translate.instant('field is required', {
        field: this.translate.instant('Name')
      });
    }
    return !Object.keys(this.languageErrors).length;
  }

  async submit(): Promise<void> {
    if (!this.validate()) {
      return;
    }

    this.loadingModalState = true;
    this.responseStatus = {};

    try {
      const { code, name, rtl } = this.model;
      const doc: LanguageDoc = {
        _id: this.doc?._id ?? '',
        _rev: this.doc?._rev,
        code: code!,
        name: name!,
        rtl: rtl ?? false,
        type: 'translations',
        generic: this.doc?.generic ?? {},
        custom: this.doc?.custom,
      };
      await this.languagesService.saveLanguage(doc);
      this.saved.emit();
      this.closed.emit();
    } catch (error) {
      console.error('Error saving language', error);
      this.responseStatus = { state: 'error', msg: 'Error saving settings' };
    } finally {
      this.loadingModalState = false;
    }
  }

  cancel(): void {
    this.closed.emit();
  }


}
