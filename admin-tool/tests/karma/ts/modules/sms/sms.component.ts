import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslateModule } from '@ngx-translate/core';
import { SmsSettingsComponent } from '@admin-tool-modules/sms/sms-settings/sms-settings.component';
import { SettingsService } from '@admin-tool-services/settings.service';
import { CountriesService } from '@admin-tool-services/countries.service';
import { Select2SearchService } from '@admin-tool-services/select2search.service';

const mockSettings = (overrides: any = {}) => ({
  gateway_number: '+1234567890',
  default_country_code: '506',
  forms_only_mode: false,
  schedule_morning_hours: 6,
  schedule_morning_minutes: 0,
  schedule_evening_hours: 18,
  schedule_evening_minutes: 0,
  outgoing_phone_replace: { match: '506', replace: '0' },
  ...overrides,
});

describe('SmsSettingsComponent', () => {
  let component: SmsSettingsComponent;
  let fixture: ComponentFixture<SmsSettingsComponent>;
  let settingsService: any;
  let countriesService: any;
  let select2SearchService: any;
  let jqueryInstance: any;

  const stabilize = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    jqueryInstance = {
      val: sinon.stub().returns('506'),
      trigger: sinon.stub().returnsThis(),
      select2: sinon.stub().returnsThis(),
    };
    (window as any).$ = sinon.stub().returns(jqueryInstance);
    (window as any).$.fn = { select2: sinon.stub() };

    settingsService = {
      get: sinon.stub().resolves(mockSettings()),
      updateSettings: sinon.stub().resolves(),
    };
    countriesService = {
      list: [
        { id: '1', text: 'United States (+1)' },
        { id: '506', text: 'Costa Rica (+506)' },
        { id: '44', text: 'United Kingdom (+44)' },
      ],
    };
    select2SearchService = { initStaticSelect: sinon.stub() };

    await TestBed.configureTestingModule({
      imports: [SmsSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: CountriesService, useValue: countriesService },
        { provide: Select2SearchService, useValue: select2SearchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsSettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => sinon.restore());

  // --- ZERO ---
  describe('Zero', () => {
    it('should initialise with empty gateway number', () => {
      expect(component.model.gateway_number).to.equal('');
    });

    it('should initialise with empty hours list', () => {
      expect(component.hours).to.have.length(0);
    });

    it('should initialise with empty minutes list', () => {
      expect(component.minutes).to.have.length(0);
    });

    it('should initialise with no errors', () => {
      expect(Object.keys(component.errors)).to.have.length(0);
    });

    it('should initialise with empty status', () => {
      expect(Object.keys(component.status)).to.have.length(0);
    });

    it('should initialise with accept_messages false', () => {
      expect(component.model.accept_messages).to.equal(false);
    });
  });

  // --- ONE ---
  describe('One', () => {
    it('should load settings and populate the model', async () => {
      await stabilize();
      expect(settingsService.get.callCount).to.equal(1);
      expect(component.model.gateway_number).to.equal('+1234567890');
    });

    it('should set accept_messages to true when forms_only_mode is false', async () => {
      await stabilize();
      expect(component.model.accept_messages).to.equal(true);
    });

    it('should set accept_messages to false when forms_only_mode is true', async () => {
      settingsService.get.resolves(mockSettings({ forms_only_mode: true }));
      await stabilize();
      expect(component.model.accept_messages).to.equal(false);
    });

    it('should populate morning hours from settings', async () => {
      await stabilize();
      expect(component.model.schedule_morning_hours).to.equal(6);
    });

    it('should populate evening hours from settings', async () => {
      await stabilize();
      expect(component.model.schedule_evening_hours).to.equal(18);
    });

    it('should populate outgoing_phone_replace from settings', async () => {
      await stabilize();
      expect(component.model.outgoing_phone_replace.replace).to.equal('0');
    });
  });

  // --- MANY ---
  describe('Many', () => {
    it('should generate 24 hour options', async () => {
      await stabilize();
      expect(component.hours).to.have.length(24);
    });

    it('should generate 12 minute options (every 5 minutes)', async () => {
      await stabilize();
      expect(component.minutes).to.have.length(12);
    });

    it('should pad single-digit hours with leading zero', async () => {
      await stabilize();
      expect(component.hours[0].name).to.equal('00');
      expect(component.hours[9].name).to.equal('09');
    });

    it('should not pad double-digit hours', async () => {
      await stabilize();
      expect(component.hours[10].name).to.equal('10');
    });

    it('should call initStaticSelect twice for both dropdowns', async () => {
      await stabilize();
      expect(select2SearchService.initStaticSelect.callCount).to.equal(2);
    });

    it('should pass the countries list to initStaticSelect', async () => {
      await stabilize();
      const firstCall = select2SearchService.initStaticSelect.getCall(0);
      expect(firstCall.args[1]).to.deep.equal(countriesService.list);
    });
  });

  // --- BOUNDARIES ---
  describe('Boundaries', () => {
    it('should default morning hours to 0 when not in settings', async () => {
      settingsService.get.resolves(
        mockSettings({ schedule_morning_hours: undefined }),
      );
      await stabilize();
      expect(component.model.schedule_morning_hours).to.equal(0);
    });

    it('should default outgoing_phone_replace to empty object when not in settings', async () => {
      settingsService.get.resolves(
        mockSettings({ outgoing_phone_replace: undefined }),
      );
      await stabilize();
      expect(component.model.outgoing_phone_replace).to.deep.equal({});
    });

    it('should set messaging_window error when morning >= evening', async () => {
      await stabilize();
      component.model.schedule_morning_hours = 18;
      component.model.schedule_morning_minutes = 0;
      component.model.schedule_evening_hours = 6;
      component.model.schedule_evening_minutes = 0;
      component.submit();
      expect(component.errors.messaging_window).to.exist;
    });

    it('should set messaging_window error when morning equals evening', async () => {
      await stabilize();
      component.model.schedule_morning_hours = 8;
      component.model.schedule_morning_minutes = 0;
      component.model.schedule_evening_hours = 8;
      component.model.schedule_evening_minutes = 0;
      component.submit();
      expect(component.errors.messaging_window).to.exist;
    });

    it('should not set messaging_window error when morning < evening', async () => {
      await stabilize();
      component.model.schedule_morning_hours = 6;
      component.model.schedule_morning_minutes = 0;
      component.model.schedule_evening_hours = 18;
      component.model.schedule_evening_minutes = 0;
      component.submit();
      expect(component.errors.messaging_window).to.not.exist;
    });

    it('should allow empty gateway number without error', async () => {
      await stabilize();
      component.model.gateway_number = '';
      component.submit();
      expect(component.errors.gateway_number).to.not.exist;
    });
  });

  // --- INTERFACE ---
  describe('Interface', () => {
    it('should call updateSettings on valid submit', async () => {
      await stabilize();
      component.submit();
      expect(settingsService.updateSettings.callCount).to.equal(1);
    });

    it('should set status loading true while submitting', async () => {
      await stabilize();
      settingsService.updateSettings.returns(new Promise(() => {}));
      component.submit();
      expect(component.status.loading).to.equal(true);
    });

    it('should set status success true after successful submit', async () => {
      await stabilize();
      settingsService.updateSettings.resolves();
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(component.status.success).to.equal(true);
    });

    it('should set status error true after failed submit', async () => {
      await stabilize();
      settingsService.updateSettings.rejects(new Error('Server error'));
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(component.status.error).to.equal(true);
    });

    it('should include forms_only_mode as inverse of accept_messages', async () => {
      await stabilize();
      component.model.accept_messages = false;
      component.submit();
      const callArg = settingsService.updateSettings.getCall(0).args[0];
      expect(callArg.forms_only_mode).to.equal(true);
    });

    it('should include forms_only_mode false when accept_messages is true', async () => {
      await stabilize();
      component.model.accept_messages = true;
      component.submit();
      const callArg = settingsService.updateSettings.getCall(0).args[0];
      expect(callArg.forms_only_mode).to.equal(false);
    });

    it('should not call updateSettings when validation fails', async () => {
      await stabilize();
      component.model.schedule_morning_hours = 18;
      component.model.schedule_evening_hours = 6;
      component.submit();
      expect(settingsService.updateSettings.callCount).to.equal(0);
    });
  });

  // --- EXCEPTIONS ---
  describe('Exceptions', () => {
    it('should log error when settings fail to load', async () => {
      const consoleStub = sinon.stub(console, 'error');
      settingsService.get.rejects(new Error('Network error'));
      await stabilize();
      expect(consoleStub.callCount).to.be.greaterThan(0);
    });

    it('should keep model defaults when settings fail to load', async () => {
      settingsService.get.rejects(new Error('Network error'));
      await stabilize();
      expect(component.model.gateway_number).to.equal('');
    });

    it('should log error when updateSettings fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      await stabilize();
      settingsService.updateSettings.rejects(new Error('Save failed'));
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(consoleStub.callCount).to.be.greaterThan(0);
    });
  });

  // --- SCENARIOS ---
  describe('Scenarios', () => {
    it('should complete full load → edit → submit flow', async () => {
      await stabilize();

      expect(component.model.gateway_number).to.equal('+1234567890');

      component.model.gateway_number = '';
      component.model.accept_messages = false;
      component.model.schedule_morning_hours = 7;
      component.model.schedule_evening_hours = 20;

      settingsService.updateSettings.resolves();
      component.submit();

      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(settingsService.updateSettings.callCount).to.equal(1);
      expect(component.status.success).to.equal(true);
    });

    it('should clear errors on each submit attempt', async () => {
      await stabilize();
      component.model.schedule_morning_hours = 18;
      component.model.schedule_evening_hours = 6;
      component.submit();
      expect(component.errors.messaging_window).to.exist;

      component.model.schedule_morning_hours = 6;
      component.model.schedule_evening_hours = 18;
      component.submit();
      expect(component.errors.messaging_window).to.not.exist;
    });

    it('should disable submit button while loading', async () => {
      await stabilize();
      component.status = { loading: true };
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[disabled]');
      expect(button).to.exist;
    });
  });
});
