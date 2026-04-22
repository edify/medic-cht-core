import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { DisplayPrivacyPoliciesComponent } from '@admin-tool-modules/display/display-privacy-policies/display-privacy-policies.component';
import { LanguagesService } from '@admin-tool-services/languages.service';

describe('DisplayPrivacyPoliciesComponent', () => {
  let component: DisplayPrivacyPoliciesComponent;
  let fixture: ComponentFixture<DisplayPrivacyPoliciesComponent>;
  let languagesService;

  const mockLanguageDocs = [
    { _id: 'messages-en', _rev: '1-abc', code: 'en', name: 'English', type: 'translations', generic: {}, custom: {} },
    { _id: 'messages-es', _rev: '1-def', code: 'es', name: 'Spanish', type: 'translations', generic: {}, custom: {} },
  ];

  const mockPrivacyPoliciesDoc = {
    _id: 'privacy-policies',
    _rev: '1-abc',
    privacy_policies: { en: 'en.html' },
    _attachments: {
      'en.html': {
        content_type: 'text/html',
        digest: 'md5-xxx',
        data: 'PGh0bWw+PC9odG1sPg==',
        revpos: 1,
      }
    }
  };

  beforeEach(waitForAsync(() => {
    languagesService = {
      getLanguageDocs: sinon.stub().resolves(mockLanguageDocs),
      getPrivacyPoliciesDoc: sinon.stub().resolves(mockPrivacyPoliciesDoc),
      savePrivacyPolicies: sinon.stub().resolves(),
    };

    return TestBed.configureTestingModule({
      imports: [DisplayPrivacyPoliciesComponent, TranslateModule.forRoot()],
      providers: [{ provide: LanguagesService, useValue: languagesService }],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(DisplayPrivacyPoliciesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  afterEach(() => sinon.restore());

  it('should create', () => {
    expect(component).to.exist;
  });

  describe('initial state', () => {
    it('should start with loadingPageStatus false', () => {
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should start with empty responseStatus', () => {
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should start with empty languagePolicyDeletes', () => {
      expect(component.languagePolicyDeletes).to.deep.equal([]);
    });
  });
  describe('ngOnInit', () => {
    it('should call getLanguageDocs on init', () => {
      expect(languagesService.getLanguageDocs.calledOnce).to.be.true;
    });

    it('should call getPrivacyPoliciesDoc with true on init', () => {
      expect(languagesService.getPrivacyPoliciesDoc.calledWith(true)).to.be.true;
    });

    it('should set privacyPoliciesDoc after init', async () => {
      await fixture.whenStable();
      expect(component.privacyPoliciesDoc).to.deep.equal(mockPrivacyPoliciesDoc);
    });

    it('should build privacyPolicyRows after init', async () => {
      await fixture.whenStable();
      expect(component.privacyPolicyRows).to.have.length(2);
    });

    it('should set attachment for language that has a policy', async () => {
      await fixture.whenStable();
      const enRow = component.privacyPolicyRows.find(row => row.code === 'en');
      expect(enRow!.attachment).to.deep.equal(mockPrivacyPoliciesDoc._attachments['en.html']);
    });

    it('should set attachment to null for language without a policy', async () => {
      await fixture.whenStable();
      const esRow = component.privacyPolicyRows.find(row => row.code === 'es');
      expect(esRow!.attachment).to.be.null;
    });

    it('should set stagedFile to null for all rows', async () => {
      await fixture.whenStable();
      component.privacyPolicyRows.forEach(row => expect(row.stagedFile).to.be.null);
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getLanguageDocs fails', async () => {
      sinon.stub(console, 'error');
      languagesService.getLanguageDocs.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should handle error if getLanguageDocs fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      languagesService.getLanguageDocs.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledOnce).to.be.true;
    });

    it('should handle error if getPrivacyPoliciesDoc fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      languagesService.getPrivacyPoliciesDoc.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledOnce).to.be.true;
    });
  });
  describe('onFileSelected', () => {
    it('should set stagedFile on the correct row', () => {
      const file = new File([''], 'en.html', { type: 'text/html' });
      const event = { target: { files: [file] } } as any;
      component.onFileSelected('en', event);
      const row = component.privacyPolicyRows.find(row => row.code === 'en');
      expect(row!.stagedFile).to.equal(file);
    });

    it('should not affect other rows when file is selected', () => {
      const file = new File([''], 'en.html', { type: 'text/html' });
      const event = { target: { files: [file] } } as any;
      component.onFileSelected('en', event);
      const esRow = component.privacyPolicyRows.find(row => row.code === 'es');
      expect(esRow!.stagedFile).to.be.null;
    });

    it('should set stagedFile to null when no file is selected', () => {
      const event = { target: { files: [] } } as any;
      component.onFileSelected('en', event);
      const row = component.privacyPolicyRows.find(row => row.code === 'en');
      expect(row!.stagedFile).to.be.null;
    });

    it('should do nothing if row code does not exist', () => {
      const file = new File([''], 'fr.html', { type: 'text/html' });
      const event = { target: { files: [file] } } as any;
      component.onFileSelected('fr', event);
      component.privacyPolicyRows.forEach(row => expect(row.stagedFile).to.be.null);
    });
  });
  describe('deletePolicy', () => {
    it('should set attachment to null on the correct row', async () => {
      await fixture.whenStable();
      component.deletePolicy('en');
      const row = component.privacyPolicyRows.find(row => row.code === 'en');
      expect(row!.attachment).to.be.null;
    });

    it('should add code to languagePolicyDeletes', async () => {
      await fixture.whenStable();
      component.deletePolicy('en');
      expect(component.languagePolicyDeletes).to.include('en');
    });

    it('should not affect other rows', async () => {
      await fixture.whenStable();
      component.deletePolicy('en');
      const esRow = component.privacyPolicyRows.find(row => row.code === 'es');
      expect(esRow!.attachment).to.be.null;
    });

    it('should do nothing if row code does not exist', async () => {
      await fixture.whenStable();
      component.deletePolicy('fr');
      expect(component.languagePolicyDeletes).to.not.include('fr');
    });
  });
});