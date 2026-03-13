import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayDateTimeComponent } from './display.date.time.component';

describe('DisplayDateTimeComponent', () => {
  let component: DisplayDateTimeComponent;
  let fixture: ComponentFixture<DisplayDateTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayDateTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayDateTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
