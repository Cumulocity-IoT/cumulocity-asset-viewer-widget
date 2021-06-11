import { NgModule } from '@angular/core';
import { CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import * as preview from './preview-image';
import { GpAssetViewerComponent } from './gp-asset-viewer.component';
import { GpAssetViewerService } from './gp-asset-viewer.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { NewDashboardModalComponent } from './new-dashboard-modal.component';
import { GpAssetOverviewAppIdService } from './gp-asset-overview-app-id.service';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { ModalModule } from 'ngx-bootstrap/modal';
@NgModule({
  declarations: [GpAssetViewerComponent, NewDashboardModalComponent],
  imports: [
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    TypeaheadModule.forRoot(),
    ModalModule.forRoot()
  ],
  exports: [GpAssetViewerComponent, NewDashboardModalComponent],
  entryComponents: [GpAssetViewerComponent, NewDashboardModalComponent],
  providers: [
    GpAssetViewerService, GpAssetOverviewAppIdService,
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'asset-viewer-widget',
        label: 'Asset Viewer',
        previewImage: preview.previewImage,
        description: 'Asset Viewer Widget with navigation to asset specific dashboard',
        component: GpAssetViewerComponent,
        configComponent: GpAssetViewerComponent,
        data: {
          ng1: {
            options: {
              noDeviceTarget: false,
              noNewWidgets: false,
              deviceTargetNotRequired: false,
              groupsSelectable: true
            }
          }
        }
      }
    }],
})
export class GpAssetViewerModule {
  constructor(private appIdService: GpAssetOverviewAppIdService) { }
}
