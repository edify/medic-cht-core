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
    it('should initialise with default empty model', () => {
      expect(component.model.gatewayNumber).to.equal('');
      expect(component.model.acceptMessages).to.equal(false);
      expect(component.model.scheduleMorningHours).to.equal(0);
      expect(component.model.scheduleMorningMinutes).to.equal(0);
      expect(component.model.scheduleEveningHours).to.equal(0);
      expect(component.model.scheduleEveningMinutes).to.equal(0);
      expect(component.model.outgoingPhoneReplace).to.deep.equal({});
    });

    it('should initialise with empty hours and minutes lists', () => {
      expect(component.hours).to.have.length(0);
      expect(component.minutes).to.have.length(0);
    });

    it('should initialise with no errors and empty status', () => {
      expect(Object.keys(component.errors)).to.have.length(0);
      expect(Object.keys(component.status)).to.have.length(0);
    });
  });

  // --- ONE ---
  describe('One', () => {
    it('should load settings and populate the model', async () => {
      await stabilize();
      expect(settingsService.get.callCount).to.equal(1);
      expect(component.model.gatewayNumber).to.equal('+1234567890');
      expect(component.model.scheduleMorningHours).to.equal(6);
      expect(component.model.scheduleEveningHours).to.equal(18);
      expect(component.model.outgoingPhoneReplace.replace).to.equal('0');
    });

    it('should set acceptMessages based on forms_only_mode', async () => {
      settingsService.get.resolves(mockSettings({ forms_only_mode: false }));
      await stabilize();
      expect(component.model.acceptMessages).to.equal(true);

      settingsService.get.resolves(mockSettings({ forms_only_mode: true }));
      fixture = TestBed.createComponent(SmsSettingsComponent);
      component = fixture.componentInstance;
      await stabilize();
      expect(component.model.acceptMessages).to.equal(false);
    });
  });

  // --- MANY ---
  describe('Many', () => {
    it('should generate correct hours and minutes options', async () => {
      await stabilize();
      expect(component.hours).to.have.length(24);
      expect(component.minutes).to.have.length(12);
      expect(component.hours[0].name).to.equal('00');
      expect(component.hours[9].name).to.equal('09');
      expect(component.hours[10].name).to.equal('10');
    });

    it('should call initStaticSelect twice with the countries list', async () => {
      await stabilize();
      expect(select2SearchService.initStaticSelect.callCount).to.equal(2);
      const firstCall = select2SearchService.initStaticSelect.getCall(0);
      expect(firstCall.args[1]).to.deep.equal(countriesService.list);
    });
  });

  // --- BOUNDARIES ---
  describe('Boundaries', () => {
    it('should default missing settings fields to safe values', async () => {
      settingsService.get.resolves(
        mockSettings({
          schedule_morning_hours: undefined,
          outgoing_phone_replace: undefined,
        }),
      );
      await stabilize();
      expect(component.model.scheduleMorningHours).to.equal(0);
      expect(component.model.outgoingPhoneReplace).to.deep.equal({});
    });

    it('should set messagingWindow error when morning time is not earlier than evening', async () => {
      await stabilize();

      component.model.scheduleMorningHours = 18;
      component.model.scheduleEveningHours = 6;
      component.submit();
      expect(component.errors.messagingWindow).to.exist;

      component.errors = {};
      component.model.scheduleMorningHours = 8;
      component.model.scheduleEveningHours = 8;
      component.submit();
      expect(component.errors.messagingWindow).to.exist;
    });

    it('should not set messagingWindow error when morning is before evening', async () => {
      await stabilize();
      component.model.scheduleMorningHours = 6;
      component.model.scheduleEveningHours = 18;
      component.submit();
      expect(component.errors.messagingWindow).to.not.exist;
    });

    it('should allow empty gateway number without validation error', async () => {
      await stabilize();
      component.model.gatewayNumber = '';
      component.submit();
      expect(component.errors.gatewayNumber).to.not.exist;
    });
  });

  // --- INTERFACE ---
  describe('Interface', () => {
    it('should call updateSettings with correct API fields on valid submit', async () => {
      await stabilize();
      component.submit();
      expect(settingsService.updateSettings.callCount).to.equal(1);
      const callArg = settingsService.updateSettings.getCall(0).args[0];
      expect(callArg.forms_only_mode).to.equal(false);
      expect(callArg.schedule_morning_hours).to.equal(6);
      expect(callArg.schedule_evening_hours).to.equal(18);
    });

    it('should map acceptMessages correctly to forms_only_mode', async () => {
      await stabilize();

      component.model.acceptMessages = false;
      component.submit();
      expect(
        settingsService.updateSettings.getCall(0).args[0].forms_only_mode,
      ).to.equal(true);

      settingsService.updateSettings.resetHistory();
      component.model.acceptMessages = true;
      component.submit();
      expect(
        settingsService.updateSettings.getCall(0).args[0].forms_only_mode,
      ).to.equal(false);
    });

    it('should set loading while submitting', async () => {
      await stabilize();
      settingsService.updateSettings.returns(new Promise(() => {}));
      component.submit();
      expect(component.status.loading).to.equal(true);
    });

    it('should set success status after successful submit', async () => {
      await stabilize();
      settingsService.updateSettings.resolves();
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(component.status.success).to.equal(true);
      expect(component.status.error).to.not.exist;
    });

    it('should set error status after failed submit', async () => {
      await stabilize();
      settingsService.updateSettings.rejects(new Error('Server error'));
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(component.status.error).to.equal(true);
      expect(component.status.success).to.not.exist;
    });

    it('should set success status that will clear after delay', async () => {
      await stabilize();
      settingsService.updateSettings.resolves();
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(component.status.success).to.equal(true);
    });

    it('should not call updateSettings when validation fails', async () => {
      await stabilize();
      component.model.scheduleMorningHours = 18;
      component.model.scheduleEveningHours = 6;
      component.submit();
      expect(settingsService.updateSettings.callCount).to.equal(0);
    });
  });

  // --- EXCEPTIONS ---
  describe('Exceptions', () => {
    it('should log error and keep default model when settings fail to load', async () => {
      const consoleStub = sinon.stub(console, 'error');
      settingsService.get.rejects(new Error('Network error'));
      await stabilize();
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.model.gatewayNumber).to.equal('');
      expect(component.hours).to.have.length(0);
    });

    it('should log error and set error status when updateSettings fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      await stabilize();
      settingsService.updateSettings.rejects(new Error('Save failed'));
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(consoleStub.callCount).to.be.greaterThan(0);
      expect(component.status.error).to.equal(true);
    });

    it('should clear the success timeout on destroy', async () => {
      await stabilize();
      settingsService.updateSettings.resolves();
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(() => component.ngOnDestroy()).to.not.throw();
    });
  });

  // --- SCENARIOS ---
  describe('Scenarios', () => {
    it('should complete full load → edit → submit flow', async () => {
      await stabilize();
      expect(component.model.gatewayNumber).to.equal('+1234567890');

      component.model.gatewayNumber = '';
      component.model.acceptMessages = false;
      component.model.scheduleMorningHours = 7;
      component.model.scheduleEveningHours = 20;

      settingsService.updateSettings.resolves();
      component.submit();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(settingsService.updateSettings.callCount).to.equal(1);
      expect(component.status.success).to.equal(true);
    });

    it('should clear errors and retry successfully after a failed validation', async () => {
      await stabilize();

      component.model.scheduleMorningHours = 18;
      component.model.scheduleEveningHours = 6;
      component.submit();
      expect(component.errors.messagingWindow).to.exist;

      component.model.scheduleMorningHours = 6;
      component.model.scheduleEveningHours = 18;
      component.submit();
      expect(component.errors.messagingWindow).to.not.exist;
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
