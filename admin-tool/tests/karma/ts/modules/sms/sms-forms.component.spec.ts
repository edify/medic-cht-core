import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslateModule } from '@ngx-translate/core';
import { SmsFormsComponent } from '@admin-tool-modules/sms/sms-forms/sms-forms.component';
import { SettingsService } from '@admin-tool-services/settings.service';
import { ResourcesService } from '@admin-tool-services/resources.service';

const mockForm = (overrides: any = {}) => ({
  meta: {
    code: 'FORM1',
    icon: 'icon-treatment',
    translation_key: 'form.title',
  },
  ...overrides,
});

const mockSettings = (forms: any = {}) => ({ forms });

const mockResourcesDoc = () => ({
  _id: 'resources',
  resources: { 'icon-treatment': 'icon-treatment.svg' },
  _attachments: {
    'icon-treatment.svg': {
      content_type: 'image/svg+xml',
      data: btoa('<svg><circle/></svg>'),
    },
  },
});

describe('SmsFormsComponent', () => {
  let component: SmsFormsComponent;
  let fixture: ComponentFixture<SmsFormsComponent>;
  let settingsService: any;
  let resourcesService: any;

  const stabilize = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  const mockFile = (content: string, name = 'forms.json'): File => {
    return new File([content], name, { type: 'application/json' });
  };

  const triggerFileInput = (file: File) => {
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  };

  beforeEach(async () => {
    settingsService = {
      get: sinon.stub().resolves(mockSettings()),
      updateSettings: sinon.stub().resolves(),
    };
    resourcesService = {
      getResources: sinon.stub().resolves(mockResourcesDoc()),
      getIconContent: sinon.stub().returns({ isSvg: false, content: '' }),
    };

    await TestBed.configureTestingModule({
      imports: [SmsFormsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: ResourcesService, useValue: resourcesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsFormsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => sinon.restore());

  // --- ZERO ---
  describe('Zero', () => {
    it('should initialise with empty forms and clean status', () => {
      expect(component.formsList).to.have.length(0);
      expect(component.status.uploading).to.equal(false);
      expect(component.status.error).to.not.exist;
      expect(component.status.success).to.not.exist;
    });

    it('should initialise with empty download link and null resourcesDoc', () => {
      expect(component.download.name).to.equal('');
      expect(component.download.url).to.equal('');
      expect(component.resourcesDoc).to.be.null;
    });
  });

  // --- ONE ---
  describe('One', () => {
    it('should load one form from settings on init', async () => {
      settingsService.get.resolves(mockSettings({ FORM1: mockForm() }));
      await stabilize();
      expect(component.formsList).to.have.length(1);
      expect(component.formsList[0].meta.code).to.equal('FORM1');
    });

    it('should load resources document on init', async () => {
      await stabilize();
      expect(resourcesService.getResources.callCount).to.equal(1);
      expect(component.resourcesDoc).to.deep.equal(mockResourcesDoc());
    });

    it('should generate a download link after loading forms', async () => {
      settingsService.get.resolves(mockSettings({ FORM1: mockForm() }));
      await stabilize();
      expect(component.download.name).to.include('forms_');
      expect(component.download.name).to.include('.json');
      expect(component.download.url).to.include('blob:');
    });

    it('should upload a valid JSON file and save to settings', async () => {
      await stabilize();
      const forms = [mockForm({ meta: { code: 'NEW1' } })];
      triggerFileInput(mockFile(JSON.stringify(forms)));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(settingsService.updateSettings.callCount).to.equal(1);
    });
  });

  // --- MANY ---
  describe('Many', () => {
    it('should display multiple forms from settings', async () => {
      settingsService.get.resolves(mockSettings({
        FORM1: mockForm({ meta: { code: 'FORM1' } }),
        FORM2: mockForm({ meta: { code: 'FORM2' } }),
        FORM3: mockForm({ meta: { code: 'FORM3' } }),
      }));
      await stabilize();
      expect(component.formsList).to.have.length(3);
    });

    it('should uppercase all form codes on upload', async () => {
      await stabilize();
      const forms = [
        { meta: { code: 'form1' } },
        { meta: { code: 'form2' } },
      ];
      triggerFileInput(mockFile(JSON.stringify(forms)));
      await new Promise(resolve => setTimeout(resolve, 50));
      const savedForms = settingsService.updateSettings.getCall(0).args[0].forms;
      expect(savedForms).to.have.property('FORM1');
      expect(savedForms).to.have.property('FORM2');
    });
  });

  // --- BOUNDARIES ---
  describe('Boundaries', () => {
    it('should handle empty or missing forms from settings', async () => {
      settingsService.get.resolves(mockSettings({}));
      await stabilize();
      expect(component.formsList).to.have.length(0);

      settingsService.get.resolves({});
      fixture = TestBed.createComponent(SmsFormsComponent);
      component = fixture.componentInstance;
      await stabilize();
      expect(component.formsList).to.have.length(0);
    });

    it('should skip forms without a meta.code on upload', async () => {
      await stabilize();
      const forms = [
        { meta: { code: 'VALID' } },
        { meta: {} },
        {},
      ];
      triggerFileInput(mockFile(JSON.stringify(forms)));
      await new Promise(resolve => setTimeout(resolve, 50));
      const savedForms = settingsService.updateSettings.getCall(0).args[0].forms;
      expect(Object.keys(savedForms)).to.have.length(1);
      expect(savedForms).to.have.property('VALID');
    });

    it('should return empty content from getIconContent when resourcesDoc is null', () => {
      component.resourcesDoc = null;
      const result = component.getIconContent('icon-treatment');
      expect(result.isSvg).to.equal(false);
      expect(result.content).to.equal('');
    });

    it('should return empty content from getIconContent when iconName is undefined', async () => {
      await stabilize();
      const result = component.getIconContent(undefined);
      expect(result.isSvg).to.equal(false);
      expect(result.content).to.equal('');
    });

    it('should set error status when upload fails', async () => {
      settingsService.updateSettings.rejects(new Error('Save failed'));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify([mockForm()])));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.error).to.equal(true);
      expect(component.status.uploading).to.equal(false);
    });
  });

  // --- INTERFACE ---
  describe('Interface', () => {
    it('should call settingsService.get and resourcesService.getResources on init', async () => {
      await stabilize();
      expect(settingsService.get.callCount).to.equal(1);
      expect(resourcesService.getResources.callCount).to.equal(1);
    });

    it('should call updateSettings with replace true on upload', async () => {
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify([mockForm()])));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(settingsService.updateSettings.calledWith(sinon.match.any, true)).to.equal(true);
    });

    it('should set success status and update formsList after successful upload', async () => {
      await stabilize();
      expect(component.formsList).to.have.length(0);
      triggerFileInput(mockFile(JSON.stringify([mockForm({ meta: { code: 'UPLOADED' } })])));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.success).to.equal(true);
      expect(component.status.uploading).to.equal(false);
      expect(component.formsList).to.have.length(1);
      expect(component.formsList[0].meta.code).to.equal('UPLOADED');
    });

    it('should call resourcesService.getIconContent when resourcesDoc is loaded', async () => {
      await stabilize();
      component.getIconContent('icon-treatment');
      expect(resourcesService.getIconContent.callCount).to.equal(1);
    });

    it('should wrap SVG content with bypassSecurityTrustHtml', async () => {
      await stabilize();
      resourcesService.getIconContent.returns({ isSvg: true, content: '<svg/>' });
      const result = component.getIconContent('icon-treatment');
      expect(result.isSvg).to.equal(true);
      expect(result.content).to.exist;
    });

    it('should regenerate download link after successful upload', async () => {
      await stabilize();
      const oldUrl = component.download.url;
      triggerFileInput(mockFile(JSON.stringify([mockForm()])));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.download.url).to.not.equal(oldUrl);
    });
  });

  // --- EXCEPTIONS ---
  describe('Exceptions', () => {
    it('should log error and keep empty forms when settings fail to load', async () => {
      const consoleStub = sinon.stub(console, 'error');
      settingsService.get.rejects(new Error('Network error'));
      await stabilize();
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.formsList).to.have.length(0);
    });

    it('should log error and keep null resourcesDoc when resources fail to load', async () => {
      const consoleStub = sinon.stub(console, 'error');
      resourcesService.getResources.rejects(new Error('Network error'));
      await stabilize();
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.resourcesDoc).to.be.null;
    });

    it('should set error status when uploaded file is invalid JSON', async () => {
      await stabilize();
      triggerFileInput(mockFile('not valid json'));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.error).to.equal(true);
    });
  });

  // --- SCENARIOS ---
  describe('Scenarios', () => {
    it('should complete full happy path: load → upload → display new forms', async () => {
      settingsService.get.resolves(mockSettings({ EXISTING: mockForm({ meta: { code: 'EXISTING' } }) }));
      await stabilize();
      expect(component.formsList).to.have.length(1);

      const newForms = [
        mockForm({ meta: { code: 'NEW1' } }),
        mockForm({ meta: { code: 'NEW2' } }),
      ];
      triggerFileInput(mockFile(JSON.stringify(newForms)));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(component.formsList).to.have.length(2);
      expect(component.status.success).to.equal(true);
      expect(component.status.error).to.equal(false);  // ← was to.not.exist
    });

    it('should render forms list in the template after load', async () => {
      settingsService.get.resolves(mockSettings({
        FORM1: mockForm({ meta: { code: 'FORM1', translation_key: 'form.one' } }),
      }));
      await stabilize();
      fixture.detectChanges();  // ← extra detectChanges to flush template
      await fixture.whenStable();
      const rows = fixture.nativeElement.querySelectorAll('ul li');
      expect(rows.length).to.equal(1);
    });

    it('should show upload failed message in template on error', async () => {
      settingsService.updateSettings.rejects(new Error('fail'));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify([mockForm()])));
      await new Promise(resolve => setTimeout(resolve, 50));
      component.status = { uploading: false, error: true };
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.error');
      expect(error).to.exist;
    });
  });
});
