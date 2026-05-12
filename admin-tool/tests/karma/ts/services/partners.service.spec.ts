import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { PartnersService } from '@admin-tool-services/partners.service';
import { DbService } from '@admin-tool-services/db.service';
import { PartnersDoc } from '@admin-tool-modules/images/images-interfaces';

describe('PartnersService', () => {
  let service: PartnersService;
  let dbService;

  const mockPartnersDoc: PartnersDoc = {
    _id: 'partners',
    _rev: '7-abc123',
    resources: {
      apple: 'logotipo-grande-de-apple.png',
      adidas: 'adidas.png',
    },
    _attachments: {
      'logotipo-grande-de-apple.png': {
        content_type: 'image/png',
        data: btoa('apple-content'),
      },
      'adidas.png': {
        content_type: 'image/png',
        data: btoa('adidas-content'),
      },
    },
  };

  beforeEach(() => {
    dbService = {
      get: sinon.stub().returns({
        get: sinon.stub().callsFake(() => Promise.resolve(JSON.parse(JSON.stringify(mockPartnersDoc)))),
        put: sinon.stub().resolves(),
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DbService, useValue: dbService }],
    });

    service = TestBed.inject(PartnersService);
  });

  afterEach(() => sinon.restore());

  describe('getPartners', () => {
    it('should call db.get with correct document id and attachments option', async () => {
      await service.getPartners();
      expect(dbService.get().get.calledWith('partners', { attachments: true })).to.be.true;
    });

    it('should return the partners doc', async () => {
      const result = await service.getPartners();
      expect(result._id).to.equal('partners');
    });

    it('should return the resources map', async () => {
      const result = await service.getPartners();
      expect(result.resources).to.deep.equal(mockPartnersDoc.resources);
    });

    it('should return empty doc if db.get returns 404', async () => {
      dbService.get().get.rejects({ status: 404 });
      const result = await service.getPartners();
      expect(result._id).to.equal('partners');
      expect(result.resources).to.deep.equal({});
      expect(result._attachments).to.deep.equal({});
    });

    it('should propagate error if db.get fails with non-404', async () => {
      dbService.get().get.rejects({ status: 500 });
      try {
        await service.getPartners();
        expect.fail('should have thrown');
      } catch (error: any) {
        expect(error.status).to.equal(500);
      }
    });
  });
  describe('getImageContent', () => {
    it('should return data URI for png image', () => {
      const result = service.getImageContent('apple', mockPartnersDoc);
      expect(result).to.equal(`data:image/png;base64,${btoa('apple-content')}`);
    });

    it('should return null if key does not exist in resources', () => {
      const result = service.getImageContent('unknown', mockPartnersDoc);
      expect(result).to.be.null;
    });

    it('should return null if attachment has no data', () => {
      const docWithoutData: PartnersDoc = {
        ...mockPartnersDoc,
        _attachments: {
          'logotipo-grande-de-apple.png': { content_type: 'image/png' }
        }
      };
      const result = service.getImageContent('apple', docWithoutData);
      expect(result).to.be.null;
    });

    it('should return null if attachment data is a File', () => {
      const docWithFile: PartnersDoc = {
        ...mockPartnersDoc,
        _attachments: {
          'logotipo-grande-de-apple.png': {
            content_type: 'image/png',
            data: new File([''], 'apple.png', { type: 'image/png' }) as any
          }
        }
      };
      const result = service.getImageContent('apple', docWithFile);
      expect(result).to.be.null;
    });

    it('should return null if resources map is empty', () => {
      const emptyDoc: PartnersDoc = {
        ...mockPartnersDoc,
        resources: {},
        _attachments: {}
      };
      const result = service.getImageContent('apple', emptyDoc);
      expect(result).to.be.null;
    });
  });
  describe('uploadPartner', () => {
    it('should call getPartners to fetch the current doc', async () => {
      await service.uploadPartner('apple', new File([''], 'apple.png', { type: 'image/png' }));
      expect(dbService.get().get.calledWith('partners', { attachments: true })).to.be.true;
    });

    it('should add the file as an inline attachment', async () => {
      const file = new File([''], 'apple.png', { type: 'image/png' });
      await service.uploadPartner('apple', file);
      const doc = dbService.get().put.args[0][0];
      expect(doc._attachments['apple.png'].content_type).to.equal('image/png');
      expect(doc._attachments['apple.png'].data).to.equal(file);
    });

    it('should add the name to the resources map', async () => {
      const file = new File([''], 'apple.png', { type: 'image/png' });
      await service.uploadPartner('apple', file);
      const doc = dbService.get().put.args[0][0];
      expect(doc.resources['apple']).to.equal('apple.png');
    });

    it('should call db.put with the updated doc', async () => {
      await service.uploadPartner('apple', new File([''], 'apple.png', { type: 'image/png' }));
      expect(dbService.get().put.calledOnce).to.be.true;
    });

    it('should propagate error if getPartners fails', async () => {
      dbService.get().get.rejects(new Error('error'));
      try {
        await service.uploadPartner('apple', new File([''], 'apple.png', { type: 'image/png' }));
        expect.fail('should have thrown');
      } catch (error: any) {
        expect(error.message).to.equal('error');
      }
    });

    it('should propagate error if db.put fails', async () => {
      dbService.get().put.rejects(new Error('put error'));
      try {
        await service.uploadPartner('apple', new File([''], 'apple.png', { type: 'image/png' }));
        expect.fail('should have thrown');
      } catch (error: any) {
        expect(error.message).to.equal('put error');
      }
    });
  });
});
