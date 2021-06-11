import { TestBed } from '@angular/core/testing';

import { GpAssetViewerService } from './gp-asset-viewer.service';

describe('GpAssetViewerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GpAssetViewerService = TestBed.get(GpAssetViewerService);
    expect(service).toBeTruthy();
  });
});
