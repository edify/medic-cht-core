import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { UpgradeConfirmComponent } from '@admin-tool-modules/upgrade/upgrade-confirm/upgrade-confirm.component';

describe('UpgradeConfirmComponent', () => {
  let component: UpgradeConfirmComponent;
  let fixture: ComponentFixture<UpgradeConfirmComponent>;

  const mockBuild = {
    build: '5.1.2.25216563202',
    version: '5.1.2',
    time: '2026-05-01T13:48:56.868Z',
    base_version: '5.1.2',
    compare: [],
    requiresIndexing: false,
  };

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [UpgradeConfirmComponent, TranslateModule.forRoot()],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(UpgradeConfirmComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
  }));

  afterEach(() => sinon.restore());

  describe('initial state', () => {
    it('should create', () => {
      expect(component).to.exist;
    });

    it('should start with visible false', () => {
      expect(component.visible).to.be.false;
    });

    it('should start with stageOnly false', () => {
      expect(component.stageOnly).to.be.false;
    });

    it('should start with build null', () => {
      expect(component.build).to.be.null;
    });

    it('should start with loadingModalState false', () => {
      expect(component.loadingModalState).to.be.false;
    });

    it('should start with isAbort false', () => {
      expect(component.isAbort).to.be.false;
    });
  });
  describe('ngOnChanges', () => {
    it('should clear loadingModalState when visible changes to true', () => {
      component.loadingModalState = true;
      component.ngOnChanges({
        visible: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
      });
      expect(component.loadingModalState).to.be.false;
    });

    it('should not clear state when visible changes to false', () => {
      component.loadingModalState = true;
      component.ngOnChanges({
        visible: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false }
      });
      expect(component.loadingModalState).to.be.true;
    });
  });
  describe('submit', () => {
    it('should not call confirmCallback if null', async () => {
      component.confirmCallback = null;
      await component.submit();
      expect(component.loadingModalState).to.be.false;
    });

    it('should set loadingModalState to true while submitting', async () => {
      component.confirmCallback = sinon.stub().callsFake(() => {
        expect(component.loadingModalState).to.be.true;
        return Promise.resolve();
      });
      await component.submit();
    });

    it('should emit closed on success', async () => {
      component.confirmCallback = sinon.stub().resolves();
      let closedEmitted = false;
      component.closed.subscribe(() => closedEmitted = true);
      await component.submit();
      expect(closedEmitted).to.be.true;
    });

    it('should emit errorOccurred and close modal if callback fails', async () => {
      component.confirmCallback = sinon.stub().rejects(new Error('error'));
      sinon.stub(console, 'error');
      let errorEmitted = false;
      let closedEmitted = false;
      component.errorOccurred.subscribe(() => errorEmitted = true);
      component.closed.subscribe(() => closedEmitted = true);
      await component.submit();
      expect(errorEmitted).to.be.true;
      expect(closedEmitted).to.be.true;
    });

    it('should emit errorOccurred if callback fails', async () => {
      component.confirmCallback = sinon.stub().rejects(new Error('error'));
      sinon.stub(console, 'error');
      let errorEmitted = false;
      component.errorOccurred.subscribe(() => errorEmitted = true);
      await component.submit();
      expect(errorEmitted).to.be.true;
    });

    it('should emit errorOccurred with errorKey if callback fails', async () => {
      component.confirmCallback = sinon.stub().rejects(new Error('error'));
      component.errorKey = 'instance.upgrade.error.deploy';
      sinon.stub(console, 'error');
      let emittedKey = '';
      component.errorOccurred.subscribe((key) => emittedKey = key);
      await component.submit();
      expect(emittedKey).to.equal('instance.upgrade.error.deploy');
    });

    it('should call console.error if callback fails', async () => {
      component.confirmCallback = sinon.stub().rejects(new Error('error'));
      const consoleStub = sinon.stub(console, 'error');
      await component.submit();
      expect(consoleStub.calledWith('Error when confirming', sinon.match.any)).to.be.true;
    });
  });
  describe('cancel', () => {
    it('should emit closed', () => {
      let closedEmitted = false;
      component.closed.subscribe(() => closedEmitted = true);
      component.cancel();
      expect(closedEmitted).to.be.true;
    });
  });
  describe('DOM', () => {
    it('should show modal when visible is true', () => {
      component.visible = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal.in')).to.exist;
    });

    it('should not show modal when visible is false', () => {
      component.visible = false;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal.in')).to.not.exist;
    });

    it('should show backdrop when visible is true', () => {
      component.visible = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal-backdrop')).to.exist;
    });

    it('should show stage title when stageOnly is true', () => {
      component.visible = true;
      component.stageOnly = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal-title')).to.exist;
    });

    it('should show no indexing alert when build.compare is empty', () => {
      component.visible = true;
      component.build = mockBuild;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-info')).to.exist;
    });

    it('should show indexing required when build.compare has items', () => {
      component.visible = true;
      component.build = {
        ...mockBuild,
        compare: [{ db: 'medic', ddoc: '_design/medic', type: ['views'], size: 100, indexing: true }],
      };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-warning')).to.exist;
    });

    it('should disable buttons when loadingModalState is true', () => {
      component.visible = true;
      component.loadingModalState = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll<HTMLButtonElement>('button:not(.close)');
      buttons.forEach(button => expect(button.disabled).to.be.true);
    });

    it('should show abort title when isAbort is true', () => {
      component.visible = true;
      component.isAbort = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal-title')).to.exist;
    });

    it('should show danger button when isAbort is true', () => {
      component.visible = true;
      component.isAbort = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-danger')).to.exist;
    });

    it('should show primary button when isAbort is false', () => {
      component.visible = true;
      component.isAbort = false;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-primary')).to.exist;
    });

    it('should show abort body when isAbort is true', () => {
      component.visible = true;
      component.isAbort = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal-body p')).to.exist;
    });

    it('should not show indexing section when isAbort is true', () => {
      component.visible = true;
      component.isAbort = true;
      component.build = mockBuild;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.alert-info')).to.not.exist;
    });
  });
});
