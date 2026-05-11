import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslateModule } from '@ngx-translate/core';
import { SmsTestComponent } from '@admin-tool-modules/sms/sms-test/sms-test.component';

describe('SmsTestComponent', () => {
  let component: SmsTestComponent;
  let fixture: ComponentFixture<SmsTestComponent>;
  let httpMock: HttpTestingController;

  const stabilize = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsTestComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsTestComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sinon.restore();
  });

  // --- ZERO ---
  describe('Zero', () => {
    it('should initialise with empty fields and clean state', () => {
      expect(component.message).to.equal('');
      expect(component.from).to.equal('');
      expect(component.saving).to.equal(false);
      expect(component.success).to.equal(false);
      expect(component.failure).to.equal(false);
      expect(Object.keys(component.errors)).to.have.length(0);
    });
  });

  // --- ONE ---
  describe('One', () => {
    it('should set message error when message is empty on submit', () => {
      component.from = '+50612345678';
      component.submit();
      expect(component.errors.message).to.equal('validate.required');
    });

    it('should set from error when from is empty on submit', () => {
      component.message = 'Test message';
      component.submit();
      expect(component.errors.from).to.equal('validate.required');
    });

    it('should send request to /api/v2/records on valid submit', async () => {
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();

      const req = httpMock.expectOne('/api/v2/records');
      expect(req.request.method).to.equal('POST');
      req.flush({});
      await stabilize();
    });

    it('should set success true after successful send', async () => {
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();

      httpMock.expectOne('/api/v2/records').flush({});
      await stabilize();

      expect(component.success).to.equal(true);
      expect(component.failure).to.equal(false);
    });
  });

  // --- MANY ---
  describe('Many', () => {
    it('should set both errors when both fields are empty', () => {
      component.submit();
      expect(component.errors.message).to.equal('validate.required');
      expect(component.errors.from).to.equal('validate.required');
    });

    it('should clear previous errors on each submit attempt', () => {
      component.submit();
      expect(component.errors.message).to.exist;

      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();
      httpMock.expectOne('/api/v2/records').flush({});
      expect(component.errors.message).to.not.exist;
      expect(component.errors.from).to.not.exist;
    });
  });

  // --- BOUNDARIES ---
  describe('Boundaries', () => {
    it('should not call API when validation fails', () => {
      component.submit();
      httpMock.expectNone('/api/v2/records');
    });

    it('should set saving to true while request is in flight', () => {
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();
      expect(component.saving).to.equal(true);
      httpMock.expectOne('/api/v2/records').flush({});
    });

    it('should set saving to false after successful send', async () => {
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();
      httpMock.expectOne('/api/v2/records').flush({});
      await stabilize();
      expect(component.saving).to.equal(false);
    });

    it('should set saving to false after failed send', async () => {
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();
      httpMock.expectOne('/api/v2/records').flush({}, { status: 500, statusText: 'Server Error' });
      await stabilize();
      expect(component.saving).to.equal(false);
    });
  });

  // --- INTERFACE ---
  describe('Interface', () => {
    it('should send message and from as form-encoded body', async () => {
      component.message = 'Hello CHT';
      component.from = '+50612345678';
      component.submit();

      const req = httpMock.expectOne('/api/v2/records');
      expect(req.request.body).to.include('message=Hello%20CHT');
      expect(req.request.body).to.include('from=%2B50612345678');
      req.flush({});
      await stabilize();
    });

    it('should send with Content-Type application/x-www-form-urlencoded', async () => {
      component.message = 'Test';
      component.from = '+506';
      component.submit();

      const req = httpMock.expectOne('/api/v2/records');
      expect(req.request.headers.get('Content-Type')).to.equal('application/x-www-form-urlencoded');
      req.flush({});
      await stabilize();
    });

    it('should reset success and failure flags on each submit', async () => {
      component.message = 'Test';
      component.from = '+506';
      component.success = true;
      component.failure = true;
      component.submit();

      expect(component.success).to.equal(false);
      expect(component.failure).to.equal(false);
      httpMock.expectOne('/api/v2/records').flush({});
      await stabilize();
    });

    it('should disable the send button while saving', async () => {
      await stabilize();
      component.saving = true;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button[disabled]');
      expect(button).to.exist;
    });
  });

  // --- EXCEPTIONS ---
  describe('Exceptions', () => {
    it('should set failure true when API returns an error', async () => {
      const consoleStub = sinon.stub(console, 'error');
      component.message = 'Test message';
      component.from = '+50612345678';
      component.submit();

      httpMock.expectOne('/api/v2/records').flush({}, { status: 500, statusText: 'Server Error' });
      await stabilize();

      expect(component.failure).to.equal(true);
      expect(component.success).to.equal(false);
      expect(consoleStub.callCount).to.be.greaterThan(0);
    });
  });

  // --- SCENARIOS ---
  describe('Scenarios', () => {
    it('should complete full happy path: fill fields → submit → success', async () => {
      await stabilize();

      component.message = 'Test SMS';
      component.from = '+50612345678';
      component.submit();

      expect(component.saving).to.equal(true);
      httpMock.expectOne('/api/v2/records').flush({});
      await stabilize();

      expect(component.success).to.equal(true);
      expect(component.saving).to.equal(false);
      expect(component.failure).to.equal(false);
    });

    it('should show error message in template when failure is true', async () => {
      component.failure = true;
      await stabilize();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).to.include('Error sending message');
    });

    it('should show required errors in template when fields are empty', async () => {
      component.submit();
      await stabilize();
      const helpBlocks = fixture.nativeElement.querySelectorAll('.help-block');
      expect(helpBlocks.length).to.be.greaterThan(0);
    });
  });
});
