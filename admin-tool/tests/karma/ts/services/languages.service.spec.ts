import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { DbService } from '@admin-tool-services/db.service';
import { SettingsService } from '@admin-tool-services/settings.service';
import { LanguagesService } from '@admin-tool-services/languages.service';

describe('LanguagesService', () => {
  let service: LanguagesService;
  let dbService;
  let settingsService;

  const mockDocs = [
    {
      _id: 'messages-en',
      _rev: '1-abc',
      code: 'en',
      name: 'English',
      type: 'translations',
      generic: { Submit: 'Submit', Cancel: 'Cancel' },
      custom: { Clinic: 'Household' },
    },
    {
      _id: 'messages-es',
      _rev: '1-def',
      code: 'es',
      name: 'Español (Spanish)',
      type: 'translations',
      generic: { Submit: 'Enviar', Cancel: 'Cancelar' },
    },
  ];

  beforeEach(() => {
    dbService = {
      get: sinon.stub().returns({
        allDocs: sinon.stub().resolves({
          rows: mockDocs.map(doc => ({ doc })),
        }),
      }),
    };

    settingsService = {
      get: sinon.stub().resolves({
        languages: [
          { locale: 'en', enabled: true },
          { locale: 'es', enabled: false },
        ],
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DbService, useValue: dbService },
        { provide: SettingsService, useValue: settingsService },
      ],
    });

    service = TestBed.inject(LanguagesService);
  });

  afterEach(() => sinon.restore());

  describe('getLanguages', () => {
    it('should call allDocs with correct params', async () => {
      await service.getLanguages();
      expect(dbService.get().allDocs.calledWith({
        startkey: 'messages-',
        endkey: 'messages-\ufff0',
        include_docs: true,
      })).to.be.true;
    });

    it('should call settingsService.get', async () => {
      await service.getLanguages();
      expect(settingsService.get.calledOnce).to.be.true;
    });

    it('should return a LanguageModel for each doc', async () => {
      const result = await service.getLanguages();
      expect(result).to.have.length(2);
    });

    it('should set enabled true when language is enabled in settings', async () => {
      const result = await service.getLanguages();
      const en = result.find(language => language.doc.code === 'en');
      expect(en!.enabled).to.be.true;
    });

    it('should set enabled false when language is disabled in settings', async () => {
      const result = await service.getLanguages();
      const es = result.find(language => language.doc.code === 'es');
      expect(es!.enabled).to.be.false;
    });

    it('should set enabled true when language is not in settings', async () => {
      settingsService.get.resolves({
        languages: [],
      });
      const result = await service.getLanguages();
      const en = result.find(language => language.doc.code === 'en');
      expect(en!.enabled).to.be.true;
    });

    it('should set enabled true when settings.languages is undefined', async () => {
      settingsService.get.resolves({});
      const result = await service.getLanguages();
      const en = result.find(language => language.doc.code === 'en');
      expect(en!.enabled).to.be.true;
    });

    it('should calculate missing translations for each language', async () => {
      const result = await service.getLanguages();
      result.forEach(language => {
        expect(language.missing).to.be.a('number');
      });
    });

    it('should handle error if allDocs fails', async () => {
      dbService.get().allDocs.rejects(new Error('error'));
      const result = service.getLanguages();
      await result.catch(err => expect(err.message).to.equal('error'));
    });
  });
  describe('countTotalTranslations', () => {
    it('should count unique keys across all docs', () => {
      const result = service['countTotalTranslations'](mockDocs as any);
      expect(result).to.equal(3);
    });

    it('should return 0 when docs array is empty', () => {
      const result = service['countTotalTranslations']([]);
      expect(result).to.equal(0);
    });
  });
  describe('countMissingTranslations', () => {
    it('should return correct number of missing translations', () => {
      const result = service['countMissingTranslations'](mockDocs[1] as any, 3);
      expect(result).to.equal(1);
    });

    it('should return 0 when doc has all translations', () => {
      const result = service['countMissingTranslations'](mockDocs[0] as any, 3);
      expect(result).to.equal(0);
    });

    it('should return total when doc has no translations', () => {
      const emptyDoc = { generic: {}, code: 'xx', name: 'Test', type: 'translations', _id: 'messages-xx' };
      const result = service['countMissingTranslations'](emptyDoc as any, 3);
      expect(result).to.equal(3);
    });
  });
});