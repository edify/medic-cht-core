import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import sinon from 'sinon';
import { AppFormsService } from '@admin-tool-services/app-forms.service';
import { DbService } from '@admin-tool-services/db.service';

describe('AppFormsService', () => {
  let service: AppFormsService;
  let dbService;

  beforeEach(() => {
    dbService = {
      get: sinon.stub().returns({
        query: sinon.stub().resolves({
          rows: [
            { 
              doc: { 
                _id: 'form:death_report', 
                type: 'form', 
                internalId: 'death_report', 
                title: 'Death report', 
                icon: 'icon-death-general' 
              } 
            },
            { 
              doc: { 
                _id: 'form:pregnancy', 
                type: 'form', 
                internalId: 'pregnancy', 
                title: 'Pregnancy registration', 
                icon: 'icon-pregnancy' 
              } 
            },
          ]
        }),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DbService, useValue: dbService },
      ],
    });

    service = TestBed.inject(AppFormsService);
  });

  afterEach(() => sinon.restore());

  describe('getForms', () => {
    it('should call query with correct parameters', async () => {
      await service.getForms();
      expect(dbService.get().query.calledWith('medic-client/doc_by_type', {
        include_docs: true,
        key: ['form']
      })).to.be.true;
    });

    it('should return mapped form docs', async () => {
      const result = await service.getForms();
      expect(result).to.have.length(2);
    });

    it('should map rows to docs correctly', async () => {
      const result = await service.getForms();
      expect(result[0]._id).to.equal('form:death_report');
      expect(result[1]._id).to.equal('form:pregnancy');
    });

    it('should handle error if query fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      dbService.get().query.rejects(new Error('error'));
      try {
        await service.getForms();
      } catch {
        expect(consoleStub.called).to.be.false;
      }
    });
  });
});
