/**
 * Copyright (c) 2020 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { NgModule } from '@angular/core';
import { CoreModule, HOOK_COMPONENTS } from '@c8y/ngx-components';
import * as preview from './preview-image';
import { GpAssetViewerComponent } from './gp-asset-viewer.component';
import { GpAssetViewerService } from './gp-asset-viewer.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
// import { MatSortModule } from '@angular/material/sort';
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
    // MatSortModule,
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
