import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslateModule } from '@ngx-translate/core';
import { BackupComponent } from '@admin-tool-modules/backup/backup.component';
import { SettingsService } from '@admin-tool-services/settings.service';

const mockSettings = () => ({
  gateway_number: '+1234567890',
  default_country_code: '506',
  locale: 'en',
});

describe('BackupComponent', () => {
  let component: BackupComponent;
  let fixture: ComponentFixture<BackupComponent>;
  let settingsService: any;

  const stabilize = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  const mockFile = (content: string, name = 'settings.json'): File => {
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

    await TestBed.configureTestingModule({
      imports: [BackupComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BackupComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => sinon.restore());

  // --- ZERO ---
  describe('Zero', () => {
    it('should initialise with empty backup link and clean status', () => {
      expect(component.backup.name).to.equal('');
      expect(component.backup.url).to.equal('');
      expect(component.status.uploading).to.equal(false);
      expect(component.status.error).to.not.exist;
      expect(component.status.success).to.not.exist;
    });
  });

  // --- ONE ---
  describe('One', () => {
    it('should generate a backup download link on init', async () => {
      await stabilize();
      expect(settingsService.get.callCount).to.equal(1);
      expect(component.backup.name).to.include('settings_');
      expect(component.backup.name).to.include('.json');
      expect(component.backup.url).to.include('blob:');
    });

    it('should restore settings from a valid JSON file', async () => {
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(settingsService.updateSettings.callCount).to.equal(1);
    });

    it('should set success status after successful restore', async () => {
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.success).to.equal(true);
      expect(component.status.uploading).to.equal(false);
      expect(component.status.error).to.equal(false);
    });
  });

  // --- BOUNDARIES ---
  describe('Boundaries', () => {
    it('should call updateSettings with replace true on restore', async () => {
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(settingsService.updateSettings.calledWith(sinon.match.any, true)).to.equal(true);
    });

    it('should set uploading true while restore is in progress', async () => {
      settingsService.updateSettings.returns(new Promise(() => {}));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(component.status.uploading).to.equal(true);
    });

    it('should set error status when restore fails', async () => {
      settingsService.updateSettings.rejects(new Error('Save failed'));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.error).to.equal(true);
      expect(component.status.uploading).to.equal(false);
    });

    it('should set error status when uploaded file is invalid JSON', async () => {
      await stabilize();
      triggerFileInput(mockFile('not valid json'));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(component.status.error).to.equal(true);
    });
  });

  // --- INTERFACE ---
  describe('Interface', () => {
    it('should disable the choose button while uploading', async () => {
      await stabilize();
      component.status = { uploading: true };
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('a.btn.disabled');
      expect(btn).to.exist;
    });

    it('should show error message in template on failed restore', async () => {
      settingsService.updateSettings.rejects(new Error('fail'));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      component.status = { uploading: false, error: true };
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.error');
      expect(error).to.exist;
    });

    it('should show loader while uploading', async () => {
      await stabilize();
      component.status = { uploading: true };
      fixture.detectChanges();
      const loader = fixture.nativeElement.querySelector('.loader');
      expect(loader).to.exist;
    });

    it('should pass the parsed settings object to updateSettings', async () => {
      await stabilize();
      const settings = mockSettings();
      triggerFileInput(mockFile(JSON.stringify(settings)));
      await new Promise(resolve => setTimeout(resolve, 50));
      const callArg = settingsService.updateSettings.getCall(0).args[0];
      expect(callArg.locale).to.equal('en');
      expect(callArg.gateway_number).to.equal('+1234567890');
    });
  });

  // --- EXCEPTIONS ---
  describe('Exceptions', () => {
    it('should log error and keep empty backup when settings fail to load', async () => {
      const consoleStub = sinon.stub(console, 'error');
      settingsService.get.rejects(new Error('Network error'));
      await stabilize();
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.backup.name).to.equal('');
    });

    it('should log error and set error status when updateSettings fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      settingsService.updateSettings.rejects(new Error('Save failed'));
      await stabilize();
      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.status.error).to.equal(true);
    });

    it('should not throw on destroy before ViewChild resolves', () => {
      expect(() => component.ngOnDestroy()).to.not.throw();
    });
  });

  // --- SCENARIOS ---
  describe('Scenarios', () => {
    it('should complete full happy path: load → download link generated → restore → success', async () => {
      await stabilize();

      expect(component.backup.name).to.include('settings_');
      expect(component.backup.url).to.include('blob:');

      triggerFileInput(mockFile(JSON.stringify(mockSettings())));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(settingsService.updateSettings.callCount).to.equal(1);
      expect(component.status.success).to.equal(true);
      expect(component.status.uploading).to.equal(false);
    });

    it('should render backup and restore sections in the template', async () => {
      await stabilize();
      fixture.detectChanges();
      const legends = fixture.nativeElement.querySelectorAll('legend');
      expect(legends.length).to.equal(2);
    });

    it('should render a download link with correct href after load', async () => {
      await stabilize();
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a[download]');
      expect(link).to.exist;
      expect(link.getAttribute('download')).to.include('settings_');
    });
  });
});
