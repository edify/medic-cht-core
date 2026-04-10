import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { DisplayLanguagesComponent } from '@admin-tool-modules/display/display-languages/display-languages.component';
import { LanguagesService } from '@admin-tool-services/languages.service';

describe('DisplayLanguagesComponent', () => {
  let component: DisplayLanguagesComponent;
  let fixture: ComponentFixture<DisplayLanguagesComponent>;
  let languagesService;

  const mockLanguages = [
    {
      doc: { _id: 'messages-en', code: 'en', name: 'English', type: 'translations', generic: {}, custom: {} },
      enabled: true,
      missing: 0,
    },
    {
      doc: { _id: 'messages-es', code: 'es', name: 'Español (Spanish)', type: 'translations', generic: {}, custom: {} },
      enabled: false,
      missing: 5,
    },
  ];

  beforeEach(waitForAsync(() => {
    languagesService = {
      getLanguages: sinon.stub().resolves(mockLanguages),
    };

    return TestBed.configureTestingModule({
      imports: [DisplayLanguagesComponent, TranslateModule.forRoot()],
      providers: [{ provide: LanguagesService, useValue: languagesService }],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(DisplayLanguagesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  afterEach(() => sinon.restore());

  it('should create', () => {
    expect(component).to.exist;
  });
  describe('initial state', () => {
    it('should start with empty languages array', () => {
      expect(component.languages).to.be.an('array');
    });

    it('should start with loadingPageStatus false', () => {
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should start with empty responseStatus', () => {
      expect(component.responseStatus).to.deep.equal({});
    });
  });
  describe('ngOnInit', () => {
    it('should call getLanguages on init', () => {
      expect(languagesService.getLanguages.calledOnce).to.be.true;
    });

    it('should fill languages array after init', async () => {
      await fixture.whenStable();
      expect(component.languages).to.have.length(2);
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getLanguages fails', async () => {
      sinon.stub(console, 'error');
      languagesService.getLanguages.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should handle error if getLanguages fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      languagesService.getLanguages.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledOnce).to.be.true;
    });
  });
  describe('editLanguage', () => {
    it('should set selectedDoc with the doc', async () => {
      const doc = mockLanguages[0].doc as any;
      await component.editLanguage(doc);
      expect(component.selectedDoc).to.equal(doc);
    });

    it('should set showEditModal to true', async () => {
      const doc = mockLanguages[0].doc as any;
      await component.editLanguage(doc);
      expect(component.showEditModal).to.be.true;
    });
  });

  describe('addLanguage', () => {
    it('should set selectedDoc to null', async () => {
      await component.addLanguage();
      expect(component.selectedDoc).to.be.null;
    });

    it('should set showEditModal to true', async () => {
      await component.addLanguage();
      expect(component.showEditModal).to.be.true;
    });
  });
  describe('DOM', () => {
    it('should show loader when loadingPageStatus is true', () => {
      component.loadingPageStatus = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loader')).to.exist;
    });

    it('should not show loader when loadingPageStatus is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loader')).to.not.exist;
    });

    it('should render a panel for each language', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panels = compiled.querySelectorAll('.panel');
      expect(panels.length).to.equal(2);
    });

    it('should show missing translations warning when missing > 0', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-warning')).to.exist;
    });

    it('should not show missing translations warning when missing is 0', async () => {
      await fixture.whenStable();
      languagesService.getLanguages.resolves([{ ...mockLanguages[0], missing: 0 }]);
      await component.ngOnInit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-warning')).to.not.exist;
    });

    it('should render Add new language button', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-primary')).to.exist;
    });
  });
});
