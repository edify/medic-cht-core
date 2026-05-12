import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { ImagesPartnersComponent } from '@admin-tool-modules/images/images-partners/images-partners.component';
import { PartnersService } from '@admin-tool-services/partners.service';
import { PartnersDoc } from '@admin-tool-modules/images/images-interfaces';

describe('ImagesPartnersComponent', () => {
  let component: ImagesPartnersComponent;
  let fixture: ComponentFixture<ImagesPartnersComponent>;
  let partnersService;

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

  beforeEach(waitForAsync(() => {
    partnersService = {
      getPartners: sinon.stub().resolves(mockPartnersDoc),
      getImageContent: sinon.stub().returns(null),
      uploadPartner: sinon.stub().resolves(),
    };

    return TestBed.configureTestingModule({
      imports: [ImagesPartnersComponent, TranslateModule.forRoot()],
      providers: [{ provide: PartnersService, useValue: partnersService }],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ImagesPartnersComponent);
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

    it('should start with empty responseStatus', () => {
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should start with empty name', () => {
      expect(component.name).to.equal('');
    });
  });
  describe('ngOnInit', () => {
    it('should call getPartners on init', () => {
      expect(partnersService.getPartners.calledOnce).to.be.true;
    });

    it('should set partnersDoc after init', async () => {
      await fixture.whenStable();
      expect(component.partnersDoc).to.deep.equal(mockPartnersDoc);
    });

    it('should set partners after init', async () => {
      await fixture.whenStable();
      expect(component.partners).to.deep.equal(['apple', 'adidas']);
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getPartners fails', async () => {
      sinon.stub(console, 'error');
      partnersService.getPartners.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should handle error if getPartners fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      partnersService.getPartners.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error fetching partners document', sinon.match.any)).to.be.true;
    });
  });
  describe('getImageContent', () => {
    it('should return null if partnersDoc is null', () => {
      component.partnersDoc = null;
      const result = component.getImageContent('apple');
      expect(result).to.be.null;
    });

    it('should call getImageContent from service with correct parameters', async () => {
      await fixture.whenStable();
      component.getImageContent('apple');
      expect(partnersService.getImageContent.calledWith('apple', mockPartnersDoc)).to.be.true;
    });

    it('should return null when service returns null', async () => {
      await fixture.whenStable();
      partnersService.getImageContent.returns(null);
      const result = component.getImageContent('apple');
      expect(result).to.be.null;
    });

    it('should return string when service returns content', async () => {
      await fixture.whenStable();
      const dataUri = `data:image/png;base64,${btoa('apple-content')}`;
      partnersService.getImageContent.returns(dataUri);
      const result = component.getImageContent('apple');
      expect(result).to.equal(dataUri);
    });
  });
  describe('submit', () => {
    beforeEach(async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    });

    const setFiles = (file: File | null) => {
      Object.defineProperty(component.logoFileRef.nativeElement, 'files', {
        value: file ? [file] : [],
        configurable: true,
      });
    };

    it('should set error if name is empty', async () => {
      component.name = '';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error message if name is empty', async () => {
      component.name = '';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.responseStatus.msg).to.equal('field is required');
    });

    it('should set error if no file selected', async () => {
      component.name = 'apple';
      setFiles(null);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error message if no file selected', async () => {
      component.name = 'apple';
      setFiles(null);
      await component.submit();
      expect(component.responseStatus.msg).to.equal('field is required');
    });

    it('should set error if file is larger than 1MB', async () => {
      component.name = 'apple';
      const file = new File([new ArrayBuffer(1000001)], 'apple.png', { type: 'image/png' });
      setFiles(file);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error message if file is larger than 1MB', async () => {
      component.name = 'apple';
      const file = new File([new ArrayBuffer(1000001)], 'apple.png', { type: 'image/png' });
      setFiles(file);
      await component.submit();
      expect(component.responseStatus.msg).to.equal('File must be less than 1MB');
    });

    it('should not call uploadPartner if name is empty', async () => {
      component.name = '';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(partnersService.uploadPartner.called).to.be.false;
    });

    it('should not call uploadPartner if no file selected', async () => {
      component.name = 'apple';
      setFiles(null);
      await component.submit();
      expect(partnersService.uploadPartner.called).to.be.false;
    });

    it('should set responseStatus to loading during submit', async () => {
      component.name = 'apple';
      const file = new File([''], 'apple.png', { type: 'image/png' });
      setFiles(file);
      partnersService.uploadPartner.callsFake(() => {
        expect(component.responseStatus.state).to.equal('loading');
        return Promise.resolve();
      });
      await component.submit();
    });

    it('should call uploadPartner with correct arguments', async () => {
      component.name = 'apple';
      const file = new File([''], 'apple.png', { type: 'image/png' });
      setFiles(file);
      await component.submit();
      expect(partnersService.uploadPartner.calledWith('apple', file)).to.be.true;
    });

    it('should reset file input after success', async () => {
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.logoFileRef.nativeElement.value).to.equal('');
    });

    it('should reset name after success', async () => {
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.name).to.equal('');
    });

    it('should call getPartners more than once after success', async () => {
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(partnersService.getPartners.callCount).to.be.greaterThan(1);
    });

    it('should clear responseStatus after success', async () => {
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should set error responseStatus if uploadPartner fails', async () => {
      partnersService.uploadPartner.rejects(new Error('error'));
      sinon.stub(console, 'error');
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
      expect(component.responseStatus.msg).to.equal('Error saving settings');
    });

    it('should call console.error if uploadPartner fails', async () => {
      partnersService.uploadPartner.rejects(new Error('error'));
      const consoleStub = sinon.stub(console, 'error');
      component.name = 'apple';
      setFiles(new File([''], 'apple.png', { type: 'image/png' }));
      await component.submit();
      expect(consoleStub.calledWith('Error uploading partner logo', sinon.match.any)).to.be.true;
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

    it('should render name input', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#name')).to.exist;
    });

    it('should render choose file button', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button.btn-default')).to.exist;
    });

    it('should render submit button', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button.btn-primary')).to.exist;
    });

    it('should disable submit button when responseStatus is loading', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'loading' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.btn-primary') as HTMLButtonElement;
      expect(button.disabled).to.be.true;
    });

    it('should show inline loader when responseStatus is loading', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'loading' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loader.inline')).to.exist;
    });

    it('should show error message when responseStatus is error', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'error', msg: 'Error saving settings' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error')).to.exist;
    });

    it('should not show partners section when partners is empty', async () => {
      await fixture.whenStable();
      component.partners = [];
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.list-inline')).to.not.exist;
    });

    it('should render partners list when partners exist', async () => {
      await fixture.whenStable();
      partnersService.getImageContent.returns(`data:image/png;base64,${btoa('apple-content')}`);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.list-inline')).to.exist;
    });

    it('should render one li per partner', async () => {
      await fixture.whenStable();
      partnersService.getImageContent.returns(`data:image/png;base64,${btoa('apple-content')}`);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll('.list-inline li');
      expect(items.length).to.equal(2);
    });
  });
});
