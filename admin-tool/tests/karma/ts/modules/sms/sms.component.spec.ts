import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { TranslateModule } from '@ngx-translate/core';
import { SmsComponent } from '@admin-tool-modules/sms/sms.component';
import { AuthService } from '@admin-tool-services/auth.service';

describe('SmsComponent', () => {
  let component: SmsComponent;
  let fixture: ComponentFixture<SmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsComponent, TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: { has: sinon.stub().resolves(true) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sinon.restore());

  it('should create the sms component', () => {
    expect(component).to.exist;
  });

  it('should render the settings tab link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.nav-item');
    expect(tabs.length).to.be.greaterThan(0);
  });

  it('should render the router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).to.exist;
  });

  it('should render inside a sms-configuration-container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sms-configuration-container')).to.exist;
  });
});
