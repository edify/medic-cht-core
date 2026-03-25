import { TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { expect } from 'chai';
import sinon from 'sinon';

import { authGuard } from '../../../../src/ts/guards/auth.guard';
import { AuthService } from '@admin-tool-services/auth.service';

describe('authGuard', () => {
  let authService;
  let router: Router;

  beforeEach(() => {
    authService = {
      has: sinon.stub(),
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => sinon.restore());

  const runGuard = (permission: string) => {
    return TestBed.runInInjectionContext(() => authGuard(permission)({} as any, {} as any));
  };

  it('should return true when user has the permission', async () => {
    authService.has.resolves(true);
    const result = await runGuard('can_configure');
    expect(result).to.be.true;
  });

  it('should return a UrlTree to / when user does not have the permission', async () => {
    authService.has.resolves(false);
    const result = await runGuard('can_configure');
    expect(result).to.deep.equal(router.parseUrl('/'));
  });

  it('should call AuthService.has with the correct permission', async () => {
    authService.has.resolves(true);
    await runGuard('can_configure');
    expect(authService.has.calledWith('can_configure')).to.be.true;
  });

  it('should return true for any permission the user has', async () => {
    authService.has.resolves(true);
    const result = await runGuard('can_edit_users');
    expect(result).to.be.true;
  });

  it('should call AuthService.has only once', async () => {
    authService.has.resolves(true);
    await runGuard('can_configure');
    expect(authService.has.calledOnce).to.be.true;
  });
});
