import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguagesService } from '@admin-tool-services/languages.service';
import { LanguageDoc, DisplayTranslationRow } from '../display-interfaces';

const TRANSLATION_KEYS_CODE = 'keys';
const TRANSLATION_KEYS_NAME = 'Translation Keys';
const DEFAULT_LANGUAGE = 'en';

@Component({
  selector: 'display-translations',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './display-translations.component.html',
  styleUrl: './display-translations.component.less'
})
export class DisplayTranslationsComponent implements OnInit {

  loadingPageStatus = false;

  docs: LanguageDoc[] = [];

  leftTranslationOptions: { code: string, name: string }[] = [];
  rightTranslationOptions: { code: string, name: string }[] = [];

  leftCode = '';
  rightCode = '';

  translationRows: DisplayTranslationRow[] = [];

  constructor(private languagesService: LanguagesService){}

  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;

    try {
      this.docs = await this.languagesService.getLanguageDocs();
      const options = this.docs.map(doc => ({ code: doc.code, name: doc.name }));
      this.rightTranslationOptions = options;
      this.leftTranslationOptions = [
        { code: TRANSLATION_KEYS_CODE, name: TRANSLATION_KEYS_NAME },
        ...options
      ];
      this.initLocaleCodes();
      this.buildTranslationRows();
    } catch (error) {
      console.error('Error fetching translation documents', error);
    } finally {
      this.loadingPageStatus = false;
    }
  } 

  private initLocaleCodes(): void {
    this.leftCode = DEFAULT_LANGUAGE;
    const right = this.rightTranslationOptions.find(translation => translation.code !== DEFAULT_LANGUAGE);
    this.rightCode = right?.code ?? DEFAULT_LANGUAGE;
  }
  
  buildTranslationRows(): void {
    const showKeys = this.leftCode === TRANSLATION_KEYS_CODE;
    const leftDoc = this.docs.find(doc => doc.code === (showKeys ? DEFAULT_LANGUAGE : this.leftCode));
    const rightDoc = this.docs.find(doc => doc.code === this.rightCode);

    const leftValues = { ...leftDoc?.generic, ...leftDoc?.custom };
    const rightValues = { ...rightDoc?.generic, ...rightDoc?.custom };

    this.translationRows = Object.keys(leftValues).map(key => ({
      key,
      leftValue: showKeys ? key : leftValues[key],
      rightValue: rightValues[key],
    }));
  }

  onDropdownChange(): void {
    this.buildTranslationRows();
  }

  //TODO
  addTranslation(): void {
    
  }

  //TODO
  editTranslation(key: string): void {
    
  }  

}
