import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { expect } from 'chai';
import sinon from 'sinon';
import { of, throwError } from 'rxjs';
import { UpgradeService } from '@admin-tool-services/upgrade.service';

describe('UpgradeService', () => {
  let service: UpgradeService;
  let http;

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

  beforeEach(() => {
    http = {
      get: sinon.stub(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(UpgradeService);
  });

  afterEach(() => sinon.restore());

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
});
