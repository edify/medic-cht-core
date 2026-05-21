import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { expect } from 'chai';
import sinon from 'sinon';
import { of, throwError } from 'rxjs';
import { UpgradeService } from '@admin-tool-services/upgrade.service';
import { VersionService } from '@admin-tool-services/version.service';

describe('UpgradeService', () => {
  let service: UpgradeService;
  let http;
  let versionService;
  let pouchDbStub;

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

  const mockBuildsResponse = {
    rows: [
      { value: 
        { 
          build: '5.1.2.25216563202', 
          version: '5.1.2', 
          time: '2026-05-01T13:48:56.868Z', 
          base_version: '5.1.2' 
        } 
      },
    ]
  };

  const mockMinVersion = { major: 5, minor: 1, patch: 1, beta: undefined };

  beforeEach(() => {
    http = {
      get: sinon.stub(),
    };

    versionService = {
      minimumNextRelease: sinon.stub(),
      parse: sinon.stub(),
    };

    pouchDbStub = {
      query: sinon.stub(),
    };

    window.PouchDB = sinon.stub().returns(pouchDbStub);


    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: VersionService, useValue: versionService },
      ],
    });

    service = TestBed.inject(UpgradeService);
  });

  afterEach(() => {
    sinon.restore();
    delete (window as any).PouchDB;
  });

  describe('getDeployInfo', () => {
    it('should call GET /api/deploy-info', async () => {
      http.get.returns(of(mockDeployInfo));
      await service.getDeployInfo();
      expect(http.get.calledWith('/api/deploy-info')).to.be.true;
    });

    it('should return the deploy info', async () => {
      http.get.returns(of(mockDeployInfo));
      const result = await service.getDeployInfo();
      expect(result).to.deep.equal(mockDeployInfo);
    });

    it('should propagate error if GET fails', async () => {
      http.get.returns(throwError(() => new Error('error')));
      await expect(service.getDeployInfo()).to.be.rejected;
    });
  });
  describe('getCanUpgrade', () => {
    it('should call GET /api/v2/upgrade/can-upgrade', async () => {
      http.get.returns(of({ ok: true }));
      await service.getCanUpgrade();
      expect(http.get.calledWith('/api/v2/upgrade/can-upgrade')).to.be.true;
    });

    it('should return true when ok is true', async () => {
      http.get.returns(of({ ok: true }));
      const result = await service.getCanUpgrade();
      expect(result).to.be.true;
    });

    it('should return false when ok is false', async () => {
      http.get.returns(of({ ok: false }));
      const result = await service.getCanUpgrade();
      expect(result).to.be.false;
    });

    it('should return false if GET fails', async () => {
      http.get.returns(throwError(() => new Error('error')));
      sinon.stub(console, 'error');
      const result = await service.getCanUpgrade();
      expect(result).to.be.false;
    });

    it('should call console.error if GET fails', async () => {
      http.get.returns(throwError(() => new Error('error')));
      const consoleStub = sinon.stub(console, 'error');
      await service.getCanUpgrade();
      expect(consoleStub.calledWith('Error when checking if upgrades are possible', sinon.match.any)).to.be.true;
    });
  });
  describe('getCurrentUpgrade', () => {
    it('should call GET /api/v2/upgrade', async () => {
      http.get.returns(of({ buildsUrl: 'https://staging.dev.medicmobile.org/_couch/builds_4' }));
      await service.getCurrentUpgrade();
      expect(http.get.calledWith('/api/v2/upgrade')).to.be.true;
    });

    it('should return buildsUrl from response', async () => {
      http.get.returns(of({ buildsUrl: 'https://staging.dev.medicmobile.org/_couch/builds_4' }));
      const result = await service.getCurrentUpgrade();
      expect(result).to.equal('https://staging.dev.medicmobile.org/_couch/builds_4');
    });

    it('should return default builds url when buildsUrl is not in response', async () => {
      http.get.returns(of({}));
      const result = await service.getCurrentUpgrade();
      expect(result).to.equal('https://staging.dev.medicmobile.org/_couch/builds_4');
    });

    it('should return default builds url if GET fails', async () => {
      http.get.returns(throwError(() => new Error('error')));
      sinon.stub(console, 'error');
      const result = await service.getCurrentUpgrade();
      expect(result).to.equal('https://staging.dev.medicmobile.org/_couch/builds_4');
    });

    it('should call console.error if GET fails', async () => {
      http.get.returns(throwError(() => new Error('error')));
      const consoleStub = sinon.stub(console, 'error');
      await service.getCurrentUpgrade();
      expect(consoleStub.calledWith('Error fetching current upgrade state', sinon.match.any)).to.be.true;
    });
  });
  describe('getBuilds', () => {
    beforeEach(() => {
      versionService.minimumNextRelease.returns(mockMinVersion);
      versionService.parse.returns({ major: 5, minor: 1, patch: 0 });
      pouchDbStub.query.resolves(mockBuildsResponse);
      http.get.returns(of({ buildsUrl: 'https://staging.dev.medicmobile.org/_couch/builds_4' }));
    });

    it('should create a PouchDB instance with the builds url', async () => {
      await service.getBuilds(mockDeployInfo);
      expect((window.PouchDB as any).calledWith('https://staging.dev.medicmobile.org/_couch/builds_4')).to.be.true;
    });

    it('should call minimumNextRelease with deployInfo version', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(versionService.minimumNextRelease.calledWith(mockDeployInfo.version)).to.be.true;
    });

    it('should call parse with deployInfo version', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(versionService.parse.calledWith(mockDeployInfo.version)).to.be.true;
    });

    it('should query releases with correct keys', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(pouchDbStub.query.calledWith('builds/releases', sinon.match({
        startkey: ['release', 'medic', 'medic', {}],
        endkey: ['release', 'medic', 'medic', mockMinVersion.major, mockMinVersion.minor, mockMinVersion.patch],
        descending: true,
        limit: 50,
      }))).to.be.true;
    });

    it('should query betas with correct keys', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(pouchDbStub.query.calledWith('builds/releases', sinon.match({
        startkey: ['beta', 'medic', 'medic', {}],
        endkey: [
          'beta', 'medic', 'medic',
          mockMinVersion.major,
          mockMinVersion.minor,
          mockMinVersion.patch,
          mockMinVersion.beta
        ],
        descending: true,
        limit: 50,
      }))).to.be.true;
    });

    it('should query branches with correct keys', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(pouchDbStub.query.calledWith('builds/releases', sinon.match({
        startkey: ['branch', 'medic', 'medic', {}],
        endkey: ['branch', 'medic', 'medic'],
        descending: true,
        limit: 50,
      }))).to.be.true;
    });

    it('should not query feature releases when not a feature release', async () => {
      await service.getBuilds(mockDeployInfo);
      expect(pouchDbStub.query.callCount).to.equal(3);
    });

    it('should query feature releases when is a feature release', async () => {
      versionService.parse.returns({ major: 5, minor: 1, patch: 0, featureRelease: 'FR-myfeature' });
      versionService.minimumNextRelease.returns({ ...mockMinVersion, featureRelease: 'FR-myfeature' });
      await service.getBuilds(mockDeployInfo);
      expect(pouchDbStub.query.callCount).to.equal(4);
    });

    it('should return releases mapped from rows', async () => {
      const result = await service.getBuilds(mockDeployInfo);
      expect(result.releases).to.deep.equal([mockBuildsResponse.rows[0].value]);
    });

    it('should return betas mapped from rows', async () => {
      const result = await service.getBuilds(mockDeployInfo);
      expect(result.betas).to.deep.equal([mockBuildsResponse.rows[0].value]);
    });

    it('should return branches mapped from rows', async () => {
      const result = await service.getBuilds(mockDeployInfo);
      expect(result.branches).to.deep.equal([mockBuildsResponse.rows[0].value]);
    });

    it('should return empty featureReleases when not a feature release', async () => {
      const result = await service.getBuilds(mockDeployInfo);
      expect(result.featureReleases).to.deep.equal([]);
    });

    it('should use fallback version when row has no version', async () => {
      pouchDbStub.query.resolves({
        rows: [{ id: 'medic:medic:5.1.2', value: { build: '5.1.2.123', time: '2026-05-01T13:48:56.868Z' } }]
      });
      const result = await service.getBuilds(mockDeployInfo);
      expect(result.releases[0].version).to.equal('5.1.2');
    });

    it('should propagate error if query fails', async () => {
      pouchDbStub.query.rejects(new Error('query error'));
      await expect(service.getBuilds(mockDeployInfo)).to.be.rejected;
    });
  });
});
