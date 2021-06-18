import { NgModule } from '@angular/core';
import { CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import * as preview from './preview-image';
import { GpAssetViewerComponent } from './gp-asset-viewer.component';
import { GpAssetViewerService } from './gp-asset-viewer.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import {GpAssetViewerConfigComponent} from './gp-asset-overview-config/gp-asset-overview-config.component';
import {NgSelectModule} from '@ng-select/ng-select';
@NgModule({
  declarations: [GpAssetViewerComponent, GpAssetViewerConfigComponent],
  imports: [
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    TypeaheadModule.forRoot(),
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    NgSelectModule
  ],
  exports: [GpAssetViewerComponent, GpAssetViewerConfigComponent],
  entryComponents: [GpAssetViewerComponent, GpAssetViewerConfigComponent],
  providers: [
    GpAssetViewerService,
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: {
        id: 'asset-viewer-widget',
        label: 'Asset Viewer',
        previewImage: preview.previewImage,
        description: 'Asset Viewer Widget with navigation to asset specific dashboard',
        component: GpAssetViewerComponent,
        configComponent: GpAssetViewerConfigComponent,
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
}
