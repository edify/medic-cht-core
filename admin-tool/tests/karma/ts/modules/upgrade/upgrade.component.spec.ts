import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { UpgradeComponent } from '@admin-tool-modules/upgrade/upgrade/upgrade.component';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { MOCK_VERSION_GROUPS } from '@admin-tool-modules/upgrade/upgrade-mock-data';

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

    it('should set versionGroups after init', async () => {
      await fixture.whenStable();
      expect(component.versionGroups.releases.length).to.be.greaterThan(0);
    });

    it('should set releases after init', async () => {
      await fixture.whenStable();
      expect(component.versionGroups.releases).to.deep.equal(MOCK_VERSION_GROUPS.releases);
    });

    it('should set betas after init', async () => {
      await fixture.whenStable();
      expect(component.versionGroups.betas).to.deep.equal(MOCK_VERSION_GROUPS.betas);
    });

    it('should set branches after init', async () => {
      await fixture.whenStable();
      expect(component.versionGroups.branches).to.deep.equal(MOCK_VERSION_GROUPS.branches);
    });
  });
  describe('potentiallyIncompatible', () => {
    beforeEach(async () => {
      await fixture.whenStable();
    });

    it('should return false when deployInfo is null', () => {
      component.deployInfo = null;
      const release = MOCK_VERSION_GROUPS.releases[0];
      expect(component.potentiallyIncompatible(release)).to.be.false;
    });

    it('should return false for a newer release', () => {
      const release = { 
        build: '5.1.2.25216563202', 
        version: '5.1.2', 
        time: '2026-05-01T13:48:56.868Z', 
        base_version: '5.1.2' 
      };
      expect(component.potentiallyIncompatible(release)).to.be.false;
    });

    it('should return true for an older release', () => {
      const release = { 
        build: '4.22.0.18399126672', 
        version: '4.22.0', 
        time: '2025-10-10T07:11:45.528Z', 
        base_version: '4.22.0' 
      };
      expect(component.potentiallyIncompatible(release)).to.be.true;
    });

    it('should return true for a branch with unparseable version', () => {
      const branch = { build: '5.1.0-master.123', version: 'master', time: '2026-05-13T06:27:07.661Z' };
      expect(component.potentiallyIncompatible(branch)).to.be.true;
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

    it('should render releases section when loadingError is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const sections = compiled.querySelectorAll('.section');
      expect(sections.length).to.be.greaterThan(1);
    });

    it('should render stage button for each release', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const releasesSection = compiled.querySelectorAll('.section')[1];
      const buttons = releasesSection.querySelectorAll('.btn-default');
      expect(buttons.length).to.equal(MOCK_VERSION_GROUPS.releases.length);
    });

    it('should render a row for each release', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const releasesSection = compiled.querySelectorAll('.section')[1];
      const rows = releasesSection.querySelectorAll('.row:not(.selection-heading)');
      expect(rows.length).to.equal(MOCK_VERSION_GROUPS.releases.length);
    });

    it('should render warning icon for potentially incompatible release', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.fa-exclamation-triangle')).to.exist;
    });

    it('should render pre-releases accordion panel', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.panel-group')).to.exist;
    });

    it('should render version badge for each release', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const releasesSection = compiled.querySelectorAll('.section')[1];
      const badges = releasesSection.querySelectorAll('.label-info');
      expect(badges.length).to.equal(MOCK_VERSION_GROUPS.releases.length);
    });
  });
});
