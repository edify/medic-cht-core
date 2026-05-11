import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { ImagesBrandingComponent } from '@admin-tool-modules/images/images-branding/images-branding.component';
import { BrandingService } from '@admin-tool-services/branding.service';
import { BrandingDoc } from '@admin-tool-modules/images/images-interfaces';

describe('ImagesBrandingComponent', () => {
  let component: ImagesBrandingComponent;
  let fixture: ComponentFixture<ImagesBrandingComponent>;
  let brandingService;

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

  beforeEach(waitForAsync(() => {
    brandingService = {
      getBranding: sinon.stub().resolves(mockBrandingDoc),
      getImageContent: sinon.stub().returns(null),
      updateBranding: sinon.stub().resolves(),
    };

    return TestBed.configureTestingModule({
      imports: [ImagesBrandingComponent, TranslateModule.forRoot()],
      providers: [
        { provide: BrandingService, useValue: brandingService },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ImagesBrandingComponent);
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
  });
  describe('ngOnInit', () => {
    it('should call getBranding on init', () => {
      expect(brandingService.getBranding.calledOnce).to.be.true;
    });

    it('should set brandingDoc after init', async () => {
      await fixture.whenStable();
      expect(component.brandingDoc).to.deep.equal(mockBrandingDoc);
    });

    it('should set title from branding doc after init', async () => {
      await fixture.whenStable();
      expect(component.title).to.equal('Community Health Toolkit');
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getBranding fails', async () => {
      sinon.stub(console, 'error');
      brandingService.getBranding.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should handle error if getBranding fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      brandingService.getBranding.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error fetching branding document', sinon.match.any)).to.be.true;
    });
  });
  describe('getImageContent', () => {
    it('should return null if brandingDoc is null', () => {
      component.brandingDoc = null;
      const result = component.getImageContent('logo');
      expect(result).to.be.null;
    });

    it('should call getImageContent from service with correct parameters', async () => {
      await fixture.whenStable();
      component.getImageContent('logo');
      expect(brandingService.getImageContent.calledWith('logo', mockBrandingDoc)).to.be.true;
    });

    it('should return null when service returns null', async () => {
      await fixture.whenStable();
      brandingService.getImageContent.returns(null);
      const result = component.getImageContent('icon');
      expect(result).to.be.null;
    });

    it('should return string when service returns content', async () => {
      await fixture.whenStable();
      const dataUri = `data:image/png;base64,${btoa('png-content')}`;
      brandingService.getImageContent.returns(dataUri);
      const result = component.getImageContent('logo');
      expect(result).to.equal(dataUri);
    });
  });
  describe('submit', () => {
    beforeEach(async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    });

    const setFiles = (logoFile: File | null, faviconFile: File | null, iconFile: File | null) => {
      Object.defineProperty(component.logoFileRef.nativeElement, 'files', {
        value: logoFile ? [logoFile] : [],
        configurable: true,
      });
      Object.defineProperty(component.faviconFileRef.nativeElement, 'files', {
        value: faviconFile ? [faviconFile] : [],
        configurable: true,
      });
      Object.defineProperty(component.iconFileRef.nativeElement, 'files', {
        value: iconFile ? [iconFile] : [],
        configurable: true,
      });
    };

    it('should set error if title is empty', async () => {
      component.title = '';
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error if logo file is larger than 100KB', async () => {
      const file = new File([new ArrayBuffer(100001)], 'logo.png', { type: 'image/png' });
      setFiles(file, null, null);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error if favicon file is larger than 100KB', async () => {
      const file = new File([new ArrayBuffer(100001)], 'favicon.ico', { type: 'image/x-icon' });
      setFiles(null, file, null);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error if icon file is larger than 100KB', async () => {
      const file = new File([new ArrayBuffer(100001)], 'icon.png', { type: 'image/png' });
      setFiles(null, null, file);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set responseStatus to loading during submit', async () => {
      brandingService.updateBranding.callsFake(() => {
        expect(component.responseStatus.state).to.equal('loading');
        return Promise.resolve();
      });
      setFiles(null, null, null);
      await component.submit();
    });

    it('should call updateBranding with correct arguments', async () => {
      const logo = new File([''], 'new-logo.png', { type: 'image/png' });
      setFiles(logo, null, null);
      await component.submit();
      expect(brandingService.updateBranding.calledWith(
        'Community Health Toolkit',
        mockBrandingDoc,
        logo,
        undefined,
        undefined
      )).to.be.true;
    });

    it('should reset file inputs after success', async () => {
      setFiles(null, null, null);
      await component.submit();
      expect(component.logoFileRef.nativeElement.value).to.equal('');
      expect(component.faviconFileRef.nativeElement.value).to.equal('');
      expect(component.iconFileRef.nativeElement.value).to.equal('');
    });

    it('should call getBranding more than once after success', async () => {
      setFiles(null, null, null);
      await component.submit();
      expect(brandingService.getBranding.callCount).to.be.greaterThan(1);
    });

    it('should clear responseStatus after success', async () => {
      setFiles(null, null, null);
      await component.submit();
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should set error responseStatus if updateBranding fails', async () => {
      brandingService.updateBranding.rejects(new Error('error'));
      sinon.stub(console, 'error');
      setFiles(null, null, null);
      await component.submit();
      expect(component.responseStatus.state).to.equal('error');
      expect(component.responseStatus.msg).to.equal('Error saving settings');
    });

    it('should call console.error if updateBranding fails', async () => {
      brandingService.updateBranding.rejects(new Error('error'));
      const consoleStub = sinon.stub(console, 'error');
      setFiles(null, null, null);
      await component.submit();
      expect(consoleStub.calledWith('Error saving branding document', sinon.match.any)).to.be.true;
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

    it('should render title input', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#title')).to.exist;
    });

    it('should render logo preview when getImageContent returns content', async () => {
      await fixture.whenStable();
      brandingService.getImageContent.returns(`data:image/png;base64,${btoa('png-content')}`);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.navbar-inverse img')).to.exist;
    });

    it('should not render logo preview when getImageContent returns null', async () => {
      await fixture.whenStable();
      brandingService.getImageContent.returns(null);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.navbar-inverse img')).to.not.exist;
    });

    it('should render favicon preview when getImageContent returns content', async () => {
      await fixture.whenStable();
      brandingService.getImageContent.returns(`data:image/x-icon;base64,${btoa('ico-content')}`);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const images = compiled.querySelectorAll('.form-group img');
      expect(images.length).to.be.greaterThan(0);
    });

    it('should render three choose file buttons', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button.btn-default');
      expect(buttons.length).to.equal(3);
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

    it('should disable choose file buttons when responseStatus is loading', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'loading' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll<HTMLButtonElement>('button.btn-default');
      buttons.forEach(button => expect(button.disabled).to.be.true);
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
  });
});
