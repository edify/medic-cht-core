import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrandingService } from '@admin-tool-services/branding.service';
import { DbService } from '@admin-tool-services/db.service';
import { BrandingDoc } from '@admin-tool-modules/images/images-interfaces';

describe('BrandingService', () => {
  let service: BrandingService;
  let dbService;

  const mockBrandingDoc: BrandingDoc = {
    _id: 'branding',
    _rev: '2-abc123',
    title: 'Community Health Toolkit',
    resources: {
      logo: 'cht-logo.png',
      favicon: 'favicon.ico',
    },
    _attachments: {
      'cht-logo.png': {
        content_type: 'image/png',
        data: btoa('png-content'),
      },
      'favicon.ico': {
        content_type: 'image/x-icon',
        data: btoa('ico-content'),
      },
    },
  };

  beforeEach(() => {
    dbService = {
      get: sinon.stub().returns({
        get: sinon.stub().resolves(mockBrandingDoc),
        put: sinon.stub().resolves(),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DbService, useValue: dbService },
      ],
    });

    service = TestBed.inject(BrandingService);
  });

  afterEach(() => sinon.restore());

  describe('getBranding', () => {
    it('should call db.get with correct document id and attachments option', async () => {
      await service.getBranding();
      expect(dbService.get().get.calledWith('branding', { attachments: true })).to.be.true;
    });

    it('should return the branding doc', async () => {
      const result = await service.getBranding();
      expect(result._id).to.equal('branding');
    });

    it('should return the title', async () => {
      const result = await service.getBranding();
      expect(result.title).to.equal('Community Health Toolkit');
    });

    it('should return the resources map', async () => {
      const result = await service.getBranding();
      expect(result.resources).to.deep.equal(mockBrandingDoc.resources);
    });

    it('should propagate error if db.get fails', async () => {
      dbService.get().get.rejects(new Error('error'));
      try {
        await service.getBranding();
        expect.fail('should have thrown');
      } catch (error: any) {
        expect(error.message).to.equal('error');
      }
    });
  });
  describe('getImageContent', () => {
    it('should return data URI for png image', () => {
      const result = service.getImageContent('logo', mockBrandingDoc);
      expect(result).to.equal(`data:image/png;base64,${btoa('png-content')}`);
    });

    it('should return data URI for ico image', () => {
      const result = service.getImageContent('favicon', mockBrandingDoc);
      expect(result).to.equal(`data:image/x-icon;base64,${btoa('ico-content')}`);
    });

    it('should return null if key does not exist in resources', () => {
      const result = service.getImageContent('icon', mockBrandingDoc);
      expect(result).to.be.null;
    });

    it('should return null if attachment has no data', () => {
      const docWithoutData: BrandingDoc = {
        ...mockBrandingDoc,
        _attachments: {
          'cht-logo.png': { content_type: 'image/png' }
        }
      };
      const result = service.getImageContent('logo', docWithoutData);
      expect(result).to.be.null;
    });

    it('should return null if attachment data is a File', () => {
      const docWithFile: BrandingDoc = {
        ...mockBrandingDoc,
        _attachments: {
          'cht-logo.png': {
            content_type: 'image/png',
            data: new File([''], 'logo.png', { type: 'image/png' }) as any
          }
        }
      };
      const result = service.getImageContent('logo', docWithFile);
      expect(result).to.be.null;
    });

    it('should return null if resources map is empty', () => {
      const emptyDoc: BrandingDoc = {
        ...mockBrandingDoc,
        resources: {},
        _attachments: {}
      };
      const result = service.getImageContent('logo', emptyDoc);
      expect(result).to.be.null;
    });
  });
});
