import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GpAssetViewerConfigComponent } from './gp-asset-overview-config.component';

describe('GpListDevicesGroupConfigComponent', () => {
  let component: GpAssetViewerConfigComponent;
  let fixture: ComponentFixture<GpAssetViewerConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GpAssetViewerConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GpAssetViewerConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
