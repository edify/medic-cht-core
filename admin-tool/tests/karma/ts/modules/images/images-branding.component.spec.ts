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
