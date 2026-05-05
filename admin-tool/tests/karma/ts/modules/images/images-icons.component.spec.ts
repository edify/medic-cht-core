import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { ImagesIconsComponent } from '@admin-tool-modules/images/images-icons/images-icons.component';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';

describe('ImagesIconsComponent', () => {
  let component: ImagesIconsComponent;
  let fixture: ComponentFixture<ImagesIconsComponent>;
  let resourcesService;

  const mockResourcesDoc: ResourcesDoc = {
    _id: 'resources',
    resources: {
      'icon-death-general': 'icon-death-general.png',
      'icon-pregnancy': 'icon-pregnancy.svg',
    },
    _attachments: {
      'icon-death-general.png': {
        content_type: 'image/png',
        data: btoa('png-content'),
      },
      'icon-pregnancy.svg': {
        content_type: 'image/svg+xml',
        data: btoa('<svg>test</svg>'),
      },
    },
  };

  beforeEach(waitForAsync(() => {
    resourcesService = {
      getResources: sinon.stub().resolves(mockResourcesDoc),
      getIconContent: sinon.stub().returns({ isSvg: false, content: '' }),
      uploadIcon: sinon.stub().resolves(),
    };

    return TestBed.configureTestingModule({
      imports: [ImagesIconsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ResourcesService, useValue: resourcesService },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ImagesIconsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  afterEach(() => sinon.restore());

  describe('initial state', () => {
    it('should create', () => {
      expect(component).to.exist;
    });

    it('should start with empty icons array', () => {
      expect(component.icons).to.be.an('array');
    });

    it('should start with loadingPageStatus false', () => {
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should start with empty responseStatus', () => {
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should start with empty iconName', () => {
      expect(component.iconName).to.equal('');
    });
  });
  describe('ngOnInit', () => {
    it('should call getResources on init', () => {
      expect(resourcesService.getResources.calledOnce).to.be.true;
    });

    it('should set icons after init', async () => {
      await fixture.whenStable();
      expect(component.icons).to.deep.equal(['icon-death-general', 'icon-pregnancy']);
    });

    it('should set resourcesDoc after init', async () => {
      await fixture.whenStable();
      expect(component.resourcesDoc).to.deep.equal(mockResourcesDoc);
    });

    it('should set loadingPageStatus to false after init', async () => {
      await fixture.whenStable();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should set loadingPageStatus to false even if getResources fails', async () => {
      sinon.stub(console, 'error');
      resourcesService.getResources.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingPageStatus).to.be.false;
    });

    it('should handle error if getResources fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      resourcesService.getResources.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error fetching resources file', sinon.match.any)).to.be.true;
    });
  });
  describe('getIconContent', () => {
    it('should return empty content if resourcesDoc is null', () => {
      component.resourcesDoc = null;
      const result = component.getIconContent('icon-death-general');
      expect(result.content).to.equal('');
      expect(result.isSvg).to.be.false;
    });

    it('should return empty content if iconName is empty', () => {
      const result = component.getIconContent('');
      expect(result.content).to.equal('');
      expect(result.isSvg).to.be.false;
    });

    it('should call getIconContent from service with correct parameters', async () => {
      await fixture.whenStable();
      component.getIconContent('icon-death-general');
      expect(resourcesService.getIconContent.calledWith('icon-death-general', mockResourcesDoc)).to.be.true;
    });

    it('should return result from service for non svg icon', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({
        isSvg: false,
        content: `data:image/png;base64,${btoa('png-content')}`
      });
      const result = component.getIconContent('icon-death-general');
      expect(result.isSvg).to.be.false;
      expect(result.content).to.equal(`data:image/png;base64,${btoa('png-content')}`);
    });

    it('should apply bypassSecurityTrustHtml for svg icon', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({ isSvg: true, content: '<svg>test</svg>' });
      const result = component.getIconContent('icon-pregnancy');
      expect(result.isSvg).to.be.true;
      expect((result.content as any).changingThisBreaksApplicationSecurity).to.equal('<svg>test</svg>');
    });
  });
  describe('upload', () => {
    beforeEach(async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    });

    const setFiles = (file: File | null) => {
      Object.defineProperty(component.iconFileRef.nativeElement, 'files', {
        value: file ? [file] : [],
        configurable: true,
      });
    };

    it('should set error if resourcesDoc is null', async () => {
      component.resourcesDoc = null;
      await component.upload();
      expect(component.responseStatus.state).to.equal('error');
      expect(component.responseStatus.msg).to.equal('Error saving settings');
    });

    it('should set error if no file and no name', async () => {
      setFiles(null);
      component.iconName = '';
      await component.upload();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error if no file selected', async () => {
      setFiles(null);
      component.iconName = 'icon-test';
      await component.upload();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set error if iconName is empty', async () => {
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = '';
      await component.upload();
      expect(component.responseStatus.state).to.equal('error');
    });

    it('should set responseStatus to loading during upload', async () => {
      resourcesService.uploadIcon.callsFake(() => {
        expect(component.responseStatus.state).to.equal('loading');
        return Promise.resolve();
      });
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
    });

    it('should call uploadIcon with correct arguments', async () => {
      const file = new File([''], 'icon-test.png', { type: 'image/png' });
      setFiles(file);
      component.iconName = 'icon-test';
      await component.upload();
      expect(resourcesService.uploadIcon.calledWith('icon-test', file)).to.be.true;
    });

    it('should reset iconFileRef after success', async () => {
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(component.iconFileRef.nativeElement.value).to.equal('');
    });

    it('should reset iconName after success', async () => {
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(component.iconName).to.equal('');
    });

    it('should call getResources more than once after success', async () => {
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(resourcesService.getResources.callCount).to.be.greaterThan(1);
    });

    it('should clear responseStatus after success', async () => {
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(component.responseStatus).to.deep.equal({});
    });

    it('should set error if uploadIcon fails', async () => {
      resourcesService.uploadIcon.rejects(new Error('error'));
      sinon.stub(console, 'error');
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(component.responseStatus.state).to.equal('error');
      expect(component.responseStatus.msg).to.equal('Error saving settings');
    });

    it('should call console.error if uploadIcon fails', async () => {
      resourcesService.uploadIcon.rejects(new Error('error'));
      const consoleStub = sinon.stub(console, 'error');
      setFiles(new File([''], 'icon-test.png', { type: 'image/png' }));
      component.iconName = 'icon-test';
      await component.upload();
      expect(consoleStub.calledWith('Error uploading image', sinon.match.any)).to.be.true;
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

    it('should render a row for each icon', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('.row');
      expect(rows.length).to.equal(2);
    });

    it('should render icon name in each row', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('.row');
      expect(rows[0].querySelector('.col-sm-11')!.textContent).to.include('icon-death-general');
    });

    it('should render img when icon is not svg', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({
        isSvg: false,
        content: `data:image/png;base64,${btoa('png-content')}`
      });
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('img')).to.exist;
    });

    it('should render span when icon is svg', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({ isSvg: true, content: '<svg>test</svg>' });
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const spans = compiled.querySelectorAll('.col-sm-1 span');
      expect(spans.length).to.be.greaterThan(0);
    });

    it('should render icon library link', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[href="https://github.com/medic/icon-library"]');
      expect(link).to.exist;
    });

    it('should render link with target blank and rel noopener', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[href="https://github.com/medic/icon-library"]') as HTMLAnchorElement;
      expect(link.target).to.equal('_blank');
      expect(link.rel).to.equal('noopener');
    });

    it('should disable upload button when responseStatus is loading', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'loading' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.btn-primary') as HTMLButtonElement;
      expect(button.disabled).to.be.true;
    });

    it('should enable upload button when responseStatus is not loading', async () => {
      await fixture.whenStable();
      component.responseStatus = {};
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.btn-primary') as HTMLButtonElement;
      expect(button.disabled).to.be.false;
    });

    it('should show loader when responseStatus is loading', async () => {
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

    it('should disable choose file button when responseStatus is loading', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'loading' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.btn-default') as HTMLButtonElement;
      expect(button.disabled).to.be.true;
    });
  });
});
