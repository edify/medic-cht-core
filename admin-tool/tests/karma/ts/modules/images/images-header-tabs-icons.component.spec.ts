import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { 
  ImagesHeaderTabsIconsComponent 
} from '@admin-tool-modules/images/images-header-tabs-icons/images-header-tabs-icons.component';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { SettingsService } from '@admin-tool-services/settings.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';


describe('ImagesHeaderTabsIconsComponent', () => {
  let component: ImagesHeaderTabsIconsComponent;
  let fixture: ComponentFixture<ImagesHeaderTabsIconsComponent>;
  let resourcesService;
  let settingsService;

  const mockResourcesDoc: ResourcesDoc = {
    _id: 'resources',
    resources: {
      'icon-pregnancy': 'icon-pregnancy.svg',
      'icon-death-general': 'icon-death-general.png',
    },
    _attachments: {
      'icon-pregnancy.svg': {
        content_type: 'image/svg+xml',
        data: btoa('<svg>test</svg>'),
      },
      'icon-death-general.png': {
        content_type: 'image/png',
        data: btoa('png-content'),
      },
    },
  };

  const mockHeaderTabsConfig = {
    messages: { icon: 'fa-envelope', resource_icon: 'icon-pregnancy' },
  };

  beforeEach(waitForAsync(() => {
    resourcesService = {
      getResources: sinon.stub().resolves(mockResourcesDoc),
      getIconContent: sinon.stub().returns({ isSvg: false, content: '' }),
    };

    settingsService = {
      getHeaderTabsSettings: sinon.stub().resolves(mockHeaderTabsConfig),
    };

    return TestBed.configureTestingModule({
      imports: [ImagesHeaderTabsIconsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ResourcesService, useValue: resourcesService },
        { provide: SettingsService, useValue: settingsService },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ImagesHeaderTabsIconsComponent);
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

    it('should start with loadingError false', () => {
      expect(component.loadingError).to.be.false;
    });

    it('should start with 5 tabs', () => {
      expect(component.tabs).to.have.length(5);
    });
  });
  describe('ngOnInit', () => {
    it('should call getResources on init', () => {
      expect(resourcesService.getResources.calledOnce).to.be.true;
    });

    it('should call getHeaderTabsSettings on init', () => {
      expect(settingsService.getHeaderTabsSettings.calledOnce).to.be.true;
    });

    it('should set resourceIcons with only SVG icons', async () => {
      await fixture.whenStable();
      expect(component.resourceIcons).to.deep.equal(['icon-pregnancy']);
    });

    it('should not include non-svg icons in resourceIcons', async () => {
      await fixture.whenStable();
      expect(component.resourceIcons).to.not.include('icon-death-general');
    });

    it('should initialize missing tabs in tabsConfig', async () => {
      await fixture.whenStable();
      expect(component.tabsConfig['tasks']).to.deep.equal({ icon: '', resource_icon: '' });
      expect(component.tabsConfig['reports']).to.deep.equal({ icon: '', resource_icon: '' });
      expect(component.tabsConfig['contacts']).to.deep.equal({ icon: '', resource_icon: '' });
      expect(component.tabsConfig['analytics']).to.deep.equal({ icon: '', resource_icon: '' });
    });

    it('should preserve existing tab config from settings', async () => {
      await fixture.whenStable();
      expect(component.tabsConfig['messages']).to.deep.equal(
        { icon: 'fa-envelope', resource_icon: 'icon-pregnancy' }
      );
    });

    it('should clear obsolete resource_icon that no longer exists in resourceIcons', async () => {
      settingsService.getHeaderTabsSettings.resolves({
        messages: { icon: 'fa-envelope', resource_icon: 'icon-old' },
      });
      await component.ngOnInit();
      expect(component.tabsConfig['messages'].resource_icon).to.equal('');
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

    it('should set loadingError to true if getResources fails', async () => {
      sinon.stub(console, 'error');
      resourcesService.getResources.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingError).to.be.true;
    });

    it('should set loadingError to true if getHeaderTabsSettings fails', async () => {
      sinon.stub(console, 'error');
      settingsService.getHeaderTabsSettings.rejects(new Error('error'));
      await component.ngOnInit();
      expect(component.loadingError).to.be.true;
    });

    it('should call console.error if init fails', async () => {
      const consoleStub = sinon.stub(console, 'error');
      resourcesService.getResources.rejects(new Error('error'));
      await component.ngOnInit();
      expect(consoleStub.calledWith('Error loading settings', sinon.match.any)).to.be.true;
    });
  });
  describe('getIconContent', () => {
    it('should return null if resourcesDoc is null', () => {
      component.resourcesDoc = null;
      const result = component.getIconContent('icon-pregnancy');
      expect(result).to.be.null;
    });

    it('should return null if key is empty', () => {
      const result = component.getIconContent('');
      expect(result).to.be.null;
    });

    it('should call getIconContent from service with correct parameters', async () => {
      await fixture.whenStable();
      component.getIconContent('icon-pregnancy');
      expect(resourcesService.getIconContent.calledWith('icon-pregnancy', mockResourcesDoc)).to.be.true;
    });

    it('should return SafeHtml when service returns svg content', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({ isSvg: true, content: '<svg>test</svg>' });
      const result = component.getIconContent('icon-pregnancy');
      expect((result as any).changingThisBreaksApplicationSecurity).to.equal('<svg>test</svg>');
    });

    it('should return null when service returns empty content', async () => {
      await fixture.whenStable();
      resourcesService.getIconContent.returns({ isSvg: false, content: '' });
      const result = component.getIconContent('icon-pregnancy');
      expect(result).to.be.null;
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

    it('should show error alert when loadingError is true', () => {
      component.loadingError = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).to.exist;
    });

    it('should not show error alert when loadingError is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-danger')).to.not.exist;
    });

    it('should not show form when loadingError is true', () => {
      component.loadingError = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).to.not.exist;
    });

    it('should show form when loadingError is false', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).to.exist;
    });

    it('should render 5 rows one per tab', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const rows = compiled.querySelectorAll('.list li.row');
      expect(rows.length).to.equal(5);
    });

    it('should render readonly input for default icon in each row', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const inputs = compiled.querySelectorAll('input[readonly]');
      expect(inputs.length).to.equal(5);
    });

    it('should render editable input for fa icon in each row', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const inputs = compiled.querySelectorAll('input:not([readonly])');
      expect(inputs.length).to.equal(5);
    });

    it('should render select for resource icon in each row', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const selects = compiled.querySelectorAll('select');
      expect(selects.length).to.equal(5);
    });

    it('should render dash option in each select', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('option[value=""]');
      expect(options.length).to.equal(5);
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

    it('should show success message when responseStatus is success', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'success', msg: 'images.header.tabs.icons.submit.success' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.success')).to.exist;
    });

    it('should show error message when responseStatus is error', async () => {
      await fixture.whenStable();
      component.responseStatus = { state: 'error', msg: 'images.header.tabs.icons.submit.failure' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.error')).to.exist;
    });
  });
});
