import { TestBed } from '@angular/core/testing';

import sinon from 'sinon';
import { expect } from 'chai';
import { of, throwError } from 'rxjs';

import { HttpClient } from '@angular/common/http';

import { SettingsService } from '@admin-tool-services/settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let http;

  beforeEach(() => {
    http = {
      get: sinon.stub(),
      put: sinon.stub(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: http }],
    });

    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getSettings', () => {
    it('should make a GET request to /api/v1/settings', async () => {
      http.get.returns(of({}));
      await service.getSettings();
      expect(http.get.calledWith('/api/v1/settings')).to.be.true;
    });

    it('should send withCredentials true', async () => {
      http.get.returns(of({}));
      await service.getSettings();
      expect(http.get.args[0][1]).to.deep.include({ withCredentials: true });
    });

    it('should return settings object', async () => {
      const mockSettings = {
        date_format: 'DD/MM/YYYY',
        reported_date_format: 'MM/DD/YYYY HH:mm:ss',
      };
      http.get.returns(of(mockSettings));
      const result = await service.getSettings();
      expect(result).to.deep.equal(mockSettings);
    });

    it('should handle empty response', async () => {
      http.get.returns(of({}));
      const result = await service.getSettings();
      expect(result).to.deep.equal({});
    });

    it('should propagate error when request fails', async () => {
      http.get.returns(throwError(() => ({ status: 500 })));
      try {
        await service.getSettings();
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });

    it('should propagate 401 error', async () => {
      http.get.returns(throwError(() => ({ status: 401 })));
      try {
        await service.getSettings();
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(401);
      }
    });
  });
  describe('updateSettings', () => {
    it('should make a PUT request to /api/v1/settings', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({ date_format: 'DD/MM/YYYY' });
      expect(http.put.calledWith('/api/v1/settings')).to.be.true;
    });

    it('should send withCredentials true', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({ date_format: 'DD/MM/YYYY' });
      expect(http.put.args[0][2]).to.deep.include({ withCredentials: true });
    });

    it('should send Content-Type application/json header', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({ date_format: 'DD/MM/YYYY' });
      expect(http.put.args[0][2].headers).to.deep.include({
        'Content-Type': 'application/json',
      });
    });

    it('should send replace=false by default', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({ date_format: 'DD/MM/YYYY' });
      expect(http.put.args[0][2].params).to.deep.include({ replace: 'false' });
    });

    it('should send replace=true when specified', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({ date_format: 'DD/MM/YYYY' }, true);
      expect(http.put.args[0][2].params).to.deep.include({ replace: 'true' });
    });

    it('should handle empty updates object', async () => {
      http.put.returns(of(void 0));
      await service.updateSettings({});
      expect(http.put.calledOnce).to.be.true;
    });

    it('should propagate error when request fails', async () => {
      http.put.returns(throwError(() => ({ status: 500 })));
      try {
        await service.updateSettings({ date_format: 'DD/MM/YYYY' });
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });
  });
  describe('getDateTimeSettings', () => {
    it('should map date_format to dateFormat', async () => {
      http.get.returns(
        of({
          date_format: 'DD/MM/YYYY',
          reported_date_format: 'MM/DD/YYYY HH:mm:ss',
        }),
      );
      const result = await service.getDateTimeSettings();
      expect(result.dateFormat).to.equal('DD/MM/YYYY');
    });

    it('should map reported_date_format to dateTimeFormat', async () => {
      http.get.returns(
        of({
          date_format: 'DD/MM/YYYY',
          reported_date_format: 'MM/DD/YYYY HH:mm:ss',
        }),
      );
      const result = await service.getDateTimeSettings();
      expect(result.dateTimeFormat).to.equal('MM/DD/YYYY HH:mm:ss');
    });

    it('should return undefined for missing date_format', async () => {
      http.get.returns(of({}));
      const result = await service.getDateTimeSettings();
      expect(result.dateFormat).to.be.undefined;
    });

    it('should return undefined for missing reported_date_format', async () => {
      http.get.returns(of({}));
      const result = await service.getDateTimeSettings();
      expect(result.dateTimeFormat).to.be.undefined;
    });

    it('should propagate error when getSettings fails', async () => {
      http.get.returns(throwError(() => ({ status: 500 })));
      try {
        await service.getDateTimeSettings();
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });
  });
  describe('updateDateTimeSettings', () => {
    it('should convert dateFormat to date_format', async () => {
      http.put.returns(of(void 0));
      await service.updateDateTimeSettings({
        dateFormat: 'DD/MM/YYYY',
        dateTimeFormat: 'MM/DD/YYYY HH:mm:ss',
      });
      expect(http.put.args[0][1]).to.deep.include({
        date_format: 'DD/MM/YYYY',
      });
    });

    it('should convert dateTimeFormat to reported_date_format', async () => {
      http.put.returns(of(void 0));
      await service.updateDateTimeSettings({
        dateFormat: 'DD/MM/YYYY',
        dateTimeFormat: 'MM/DD/YYYY HH:mm:ss',
      });
      expect(http.put.args[0][1]).to.deep.include({
        reported_date_format: 'MM/DD/YYYY HH:mm:ss',
      });
    });

    it('should propagate error when updateSettings fails', async () => {
      http.put.returns(throwError(() => ({ status: 500 })));
      try {
        await service.updateDateTimeSettings({
          dateFormat: 'DD/MM/YYYY',
          dateTimeFormat: 'MM/DD/YYYY HH:mm:ss',
        });
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });
  });
  describe('getRoles', () => {
    it('should call getSettings', async () => {
      http.get.returns(of({ roles: {} }));
      await service.getRoles();
      expect(http.get.calledWith('/api/v1/settings')).to.be.true;
    });

    it('should return roles from settings', async () => {
      const mockRoles = {
        chw: { name: 'usertype.chw', offline: true },
        national_admin: { name: 'usertype.national_admin' },
      };
      http.get.returns(of({ roles: mockRoles }));
      const result = await service.getRoles();
      expect(result).to.deep.equal(mockRoles);
    });

    it('should return empty object when roles is undefined', async () => {
      http.get.returns(of({}));
      const result = await service.getRoles();
      expect(result).to.deep.equal({});
    });

    it('should propagate error when getSettings fails', async () => {
      http.get.returns(throwError(() => ({ status: 500 })));
      try {
        await service.getRoles();
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });
  });

  describe('updateRoles', () => {
    it('should call updateSettings with roles and replace=true', async () => {
      http.put.returns(of(void 0));
      const mockRoles = { chw: { name: 'usertype.chw', offline: true } };
      await service.updateRoles(mockRoles);
      expect(http.put.calledWith('/api/v1/settings')).to.be.true;
    });

    it('should send replace=true', async () => {
      http.put.returns(of(void 0));
      await service.updateRoles({ chw: { name: 'usertype.chw' } });
      expect(http.put.args[0][2].params).to.deep.include({ replace: 'true' });
    });

    it('should send roles in the body', async () => {
      http.put.returns(of(void 0));
      const mockRoles = { chw: { name: 'usertype.chw', offline: true } };
      await service.updateRoles(mockRoles);
      expect(http.put.args[0][1]).to.deep.equal({ roles: mockRoles });
    });

    it('should propagate error when request fails', async () => {
      http.put.returns(throwError(() => ({ status: 500 })));
      try {
        await service.updateRoles({ chw: { name: 'usertype.chw' } });
        expect.fail('should have thrown');
      } catch (err: any) {
        expect(err.status).to.equal(500);
      }
    });
  });
});
