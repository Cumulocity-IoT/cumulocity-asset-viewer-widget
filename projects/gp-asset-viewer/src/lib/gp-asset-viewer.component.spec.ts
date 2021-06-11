import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GpAssetViewerComponent } from './gp-asset-viewer.component';

describe('GpAssetViewerComponent', () => {
  let component: GpAssetViewerComponent;
  let fixture: ComponentFixture<GpAssetViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GpAssetViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GpAssetViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
