import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { UpgradeComponent } from '@admin-tool-modules/upgrade/upgrade/upgrade.component';
import { UpgradeService } from '@admin-tool-services/upgrade.service';

describe('UpgradeComponent', () => {
  let component: UpgradeComponent;
  let fixture: ComponentFixture<UpgradeComponent>;
  let upgradeService;

  const mockDeployInfo = {
    build: 'feature-manage-tab-icons-044-1778681718822',
    version: '5.1.0-local-development',
    base_version: '5.1.0',
    author: 'npm on Sigifredo Chacon',
    time: '2026-05-13T14:15:18.907Z',
    timestamp: 1778681934051,
    application: 'medic',
    namespace: 'medic',
    schema_version: 2,
  };

  beforeEach(waitForAsync(() => {
    upgradeService = {
      getDeployInfo: sinon.stub().resolves(mockDeployInfo),
      getCanUpgrade: sinon.stub().resolves(false),
    };

    return TestBed.configureTestingModule({
      imports: [UpgradeComponent, TranslateModule.forRoot()],
      providers: [
        { provide: UpgradeService, useValue: upgradeService },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(UpgradeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  afterEach(() => sinon.restore());

  describe('initial state', () => {
    it('should create', () => {
      expect(component).to.exist;
    });

    it('should start with loadingPageStatus false', () => {
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should start with loadingError false', () => {
      expect(component.loadingError).to.be.false;
    });

    it('should start with canUpgrade false', () => {
      expect(component.canUpgrade).to.be.false;
    });
  });
  describe('ngOnInit', () => {
    it('should call getDeployInfo on init', () => {
      expect(upgradeService.getDeployInfo.calledOnce).to.be.true;
    });

    it('should call getCanUpgrade on init', () => {
      expect(upgradeService.getCanUpgrade.calledOnce).to.be.true;
    });

    it('should set deployInfo after init', async () => {
      await fixture.whenStable();
      expect(component.deployInfo).to.deep.equal(mockDeployInfo);
    });

    it('should set canUpgrade after init', async () => {
      await fixture.whenStable();
      expect(component.canUpgrade).to.be.false;
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getDeployInfo fails', async () => {
      sinon.stub(console, 'error');
      upgradeService.getDeployInfo.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingError to true if getDeployInfo fails', async () => {
      sinon.stub(console, 'error');
      upgradeService.getDeployInfo.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingError).to.be.true;
    });

    it('should call console.error if getDeployInfo fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      upgradeService.getDeployInfo.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error fetching upgrade information', sinon.match.any)).to.be.true;
    });

    it('should not set loadingError if only getCanUpgrade fails', async () => {
      upgradeService.getCanUpgrade.resolves(false);
      await component.ngOnInit();
      expect(component.loadingError).to.be.false;
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

    it('should show error alert when loadingError is true', () => {
      component.loadingError = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).to.exist;
    });

    it('should not show error alert when loadingError is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).to.not.exist;
    });

    it('should show current version section when loadingError is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.section')).to.exist;
    });

    it('should not show current version section when loadingError is true', () => {
      component.loadingError = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.section')).to.not.exist;
    });

    it('should render base_version in the dl', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const dds = compiled.querySelectorAll('dd');
      expect(dds[0].textContent).to.include('5.1.0');
    });

    it('should render version in the dl', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const dds = compiled.querySelectorAll('dd');
      expect(dds[1].textContent).to.include('5.1.0-local-development');
    });

    it('should render description paragraph', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p')).to.exist;
    });
  });
});