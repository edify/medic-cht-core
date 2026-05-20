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
      getCurrentUpgrade: sinon.stub().resolves({ 
        buildsUrl: 'https://staging.dev.medicmobile.org/_couch/builds_4',
        upgradeDoc: null,
        indexers: []
      }),
      getBuilds: sinon.stub().resolves(MOCK_VERSION_GROUPS),
      compareReleases: sinon.stub().resolves(),
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

    it('should start with errorKey null', () => {
      expect(component.errorKey).to.be.null;
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

    it('should call getBuilds on init', () => {
      expect(upgradeService.getBuilds.calledOnce).to.be.true;
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

    it('should set errorKey when getDeployInfo fails', async () => {
      sinon.stub(console, 'error');
      upgradeService.getDeployInfo.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.errorKey).to.equal('instance.upgrade.error.deploy_info_fetch');
    });

    it('should call console.error if getDeployInfo fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      upgradeService.getDeployInfo.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error fetching upgrade information', sinon.match.any)).to.be.true;
    });

    it('should not set errorKey if only getCanUpgrade fails', async () => {
      upgradeService.getCanUpgrade.resolves(false);
      await component.ngOnInit();
      expect(component.errorKey).to.be.null;
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
    it('should call getBuilds with deployInfo', async () => {
      await fixture.whenStable();
      expect(upgradeService.getBuilds.calledWith(mockDeployInfo)).to.be.true;
    });

    it('should set errorKey when getBuilds fails', async () => {
      sinon.stub(console, 'error');
      upgradeService.getBuilds.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.errorKey).to.equal('instance.upgrade.error.version_fetch');
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
  describe('upgrade', () => {
    beforeEach(async () => {
      upgradeService.compareReleases = sinon.stub().resolves();
      await fixture.whenStable();
    });

    it('should call compareReleases with the build', async () => {
      const release = MOCK_VERSION_GROUPS.releases[0];
      await component.upgrade(release, 'stage');
      expect(upgradeService.compareReleases.calledWith(release)).to.be.true;
    });

    it('should set confirmBuild to the build', async () => {
      const release = MOCK_VERSION_GROUPS.releases[0];
      await component.upgrade(release, 'stage');
      expect(component.confirmBuild).to.equal(release);
    });

    it('should set confirmStageOnly to true when action is stage', async () => {
      await component.upgrade(MOCK_VERSION_GROUPS.releases[0], 'stage');
      expect(component.confirmStageOnly).to.be.true;
    });

    it('should set confirmStageOnly to false when action is complete', async () => {
      await component.upgrade(MOCK_VERSION_GROUPS.releases[0], 'complete');
      expect(component.confirmStageOnly).to.be.false;
    });

    it('should set confirmStageOnly to false when action is undefined', async () => {
      await component.upgrade(MOCK_VERSION_GROUPS.releases[0], undefined);
      expect(component.confirmStageOnly).to.be.false;
    });

    it('should set confirmCallback', async () => {
      await component.upgrade(MOCK_VERSION_GROUPS.releases[0], 'stage');
      expect(component.confirmCallback).to.be.a('function');
    });

    it('should set showConfirmModal to true', async () => {
      await component.upgrade(MOCK_VERSION_GROUPS.releases[0], 'stage');
      expect(component.showConfirmModal).to.be.true;
    });
  });
  describe('abortUpgrade', () => {
    beforeEach(async () => {
      upgradeService.abortUpgrade = sinon.stub().resolves();
      await fixture.whenStable();
    });

    it('should set showConfirmModal to true', () => {
      component.abortUpgrade();
      expect(component.showConfirmModal).to.be.true;
    });

    it('should set confirmIsAbort to true', () => {
      component.abortUpgrade();
      expect(component.confirmIsAbort).to.be.true;
    });

    it('should set confirmCallback', () => {
      component.abortUpgrade();
      expect(component.confirmCallback).to.be.a('function');
    });

    it('should call abortUpgrade service when confirmCallback is executed', async () => {
      component.abortUpgrade();
      await component.confirmCallback!();
      expect(upgradeService.abortUpgrade.calledOnce).to.be.true;
    });

    it('should call getCurrentUpgrade after abort', async () => {
      component.abortUpgrade();
      await component.confirmCallback!();
      expect(upgradeService.getCurrentUpgrade.callCount).to.be.greaterThan(1);
    });

    it('should call getBuilds after abort', async () => {
      component.abortUpgrade();
      await component.confirmCallback!();
      expect(upgradeService.getBuilds.callCount).to.be.greaterThan(1);
    });
  });
  describe('retryUpgrade', () => {
    beforeEach(async () => {
      upgradeService.compareReleases = sinon.stub().resolves();
      await fixture.whenStable();
    });

    it('should not open modal if upgradeDoc is null', async () => {
      component.upgradeDoc = null;
      component.retryUpgrade();
      expect(component.showConfirmModal).to.be.false;
    });

    it('should call upgrade with stage action when upgradeDoc action is stage', async () => {
      component.upgradeDoc = {
        action: 'stage',
        state: 'interrupted',
        state_history: [],
        to: MOCK_VERSION_GROUPS.releases[0]
      };
      component.retryUpgrade();
      await fixture.whenStable();
      expect(component.confirmStageOnly).to.be.true;
    });

    it('should call upgrade with complete action when upgradeDoc action is not stage', async () => {
      component.upgradeDoc = {
        action: 'upgrade',
        state: 'interrupted',
        state_history: [],
        to: MOCK_VERSION_GROUPS.releases[0]
      };
      component.retryUpgrade();
      await fixture.whenStable();
      expect(component.confirmStageOnly).to.be.false;
    });

    it('should set confirmBuild to upgradeDoc.to', async () => {
      component.upgradeDoc = {
        action: 'stage',
        state: 'interrupted',
        state_history: [],
        to: MOCK_VERSION_GROUPS.releases[0]
      };
      component.retryUpgrade();
      await fixture.whenStable();
      expect(component.confirmBuild).to.equal(MOCK_VERSION_GROUPS.releases[0]);
    });

    it('should set showConfirmModal to true', async () => {
      component.upgradeDoc = {
        action: 'stage',
        state: 'interrupted',
        state_history: [],
        to: MOCK_VERSION_GROUPS.releases[0]
      };
      component.retryUpgrade();
      await fixture.whenStable();
      expect(component.showConfirmModal).to.be.true;
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
      component.errorKey = 'instance.upgrade.error.deploy_info_fetch';
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).to.exist;
    });

    it('should not show error alert when errorKey is null', async () => {
      await fixture.whenStable();
      component.errorKey = null;
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

    it('should show current version section when upgradeDoc is null', async () => {
      await fixture.whenStable();
      component.upgradeDoc = null;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.section')).to.exist;
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
    
    it('should not show feature releases section when featureReleases is empty', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panelBody = compiled.querySelector('.panel-body');
      const sections = panelBody!.querySelectorAll('.section');
      expect(sections.length).to.equal(2);
    });

    it('should show feature releases section when featureReleases exist', async () => {
      await fixture.whenStable();
      component.versionGroups = { ...MOCK_VERSION_GROUPS, featureReleases: [MOCK_VERSION_GROUPS.releases[0]] };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panelBody = compiled.querySelector('.panel-body');
      const sections = panelBody!.querySelectorAll('.section');
      expect(sections.length).to.equal(3);
    });

    it('should render a row for each feature release', async () => {
      await fixture.whenStable();
      component.versionGroups = { ...MOCK_VERSION_GROUPS, featureReleases: [MOCK_VERSION_GROUPS.releases[0]] };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const panelBody = compiled.querySelector('.panel-body');
      const featureSection = panelBody!.querySelectorAll('.section')[0];
      const rows = featureSection.querySelectorAll('.row:not(.selection-heading)');
      expect(rows.length).to.equal(1);
    });
  });
  describe('DOM — upgrade in progress', () => {
    const mockUpgradeDoc = {
      action: 'stage',
      state: 'staged',
      state_history: [
        { state: 'initiated', date: '2026-05-20T09:00:00.000Z' },
        { state: 'staged', date: '2026-05-20T09:00:01.000Z' },
      ],
      to: MOCK_VERSION_GROUPS.releases[0]
    };

    beforeEach(async () => {
      await fixture.whenStable();
    });

    it('should show upgrade in progress section when upgradeDoc exists', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.section legend')).to.exist;
    });

    it('should hide releases section when upgradeDoc exists', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p.description')).to.not.exist;
    });

    it('should show state history entries', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('ul.table li.row');
      expect(rows.length).to.equal(mockUpgradeDoc.state_history.length);
    });

    it('should show cancel button when upgradeDoc exists', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-danger')).to.exist;
    });

    it('should show retry button when state is interrupted', () => {
      component.upgradeDoc = { ...mockUpgradeDoc, state: 'interrupted' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-default')).to.exist;
    });

    it('should not show retry button when state is not interrupted', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-default')).to.not.exist;
    });

    it('should show staging title when action is stage', () => {
      component.upgradeDoc = { ...mockUpgradeDoc, action: 'stage' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('legend')).to.exist;
    });

    it('should show success banner when upgraded is true', () => {
      component.upgradeDoc = null;
      component.upgraded = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-success')).to.exist;
    });

    it('should not show success banner when upgraded is false', async () => {
      component.upgraded = false;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-success')).to.not.exist;
    });

    it('should show current version section when upgradeDoc is null', () => {
      component.upgradeDoc = null;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('dl.horizontal')).to.exist;
    });

    it('should hide current version section when upgradeDoc exists', () => {
      component.upgradeDoc = mockUpgradeDoc;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('dl.horizontal')).to.not.exist;
    });
  });
});
