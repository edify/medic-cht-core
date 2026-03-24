import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationRolesComponent } from './authorization-roles.component';

describe('AuthorizationRolesComponent', () => {
  let component: AuthorizationRolesComponent;
  let fixture: ComponentFixture<AuthorizationRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationRolesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorizationRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
