/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
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

import {Component, OnInit} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, InventoryService} from '@c8y/client';
import { Router } from '@angular/router';
@Component({
    templateUrl: './new-dashboard-modal.component.html'
})
export class NewDashboardModalComponent implements OnInit {
    busy = false;

    creationMode: 'blank' | 'template' | 'existing' | 'clone' = 'blank';

    dashboardId = '';
    existingDashboardId = '';
    dashboardName = '';
    dashboardIcon = 'th';
    tabGroup = '';
    deviceId = '';
    deviceName = '';

    dashboardTemplate: 'welcome' = 'welcome';

    app: any;
//    widgetId: any;
    deviceDashboardObj: any;
    appId: any;
    groupId: any;
    dashboardNameList = [];


    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService,
                private inventoryService: InventoryService, private router: Router) {}

    async ngOnInit() {
       //  console.log(this.dashboardList);
        await this.loadApplicationDashboards();
    }
    showId() {
        switch (this.creationMode) {
            case 'existing':
            case 'clone':
                return true;
            default: return false;
        }
    }

    async createDashboard() {
        this.busy = true;
        this.app = (await this.appService.detail(this.appId)).data as any;
        if (this.dashboardId) {
            this.creationMode = 'clone';
        } else if (this.existingDashboardId) {
            this.creationMode = 'existing';
        }
        switch (this.creationMode) {
            case 'blank': {
                await this.addNewDashboard(this.app, this.dashboardName, this.dashboardIcon, this.tabGroup);
                this.navigateToDashboard();
                this.bsModalRef.hide();
                break;
            }
            /* case 'template': {
                await this.addTemplateDashboardByTemplateName(this.app, this.dashboardName, this.dashboardIcon, this.dashboardTemplate);
                break;
            } */
            case 'existing': {
                await this.addExistingDashboard(this.app, this.dashboardName, this.existingDashboardId, this.dashboardIcon, this.tabGroup);
                this.navigateToDashboard();
                this.bsModalRef.hide();
                break;
            }
            case 'clone': {
                await this.addClonedDashboard(this.app, this.dashboardName, this.dashboardId, this.dashboardIcon, this.tabGroup);
                this.navigateToDashboard();
                this.bsModalRef.hide();
                break;
            }
            default: {
                throw Error(`Unknown dashboard creation mode: ${this.creationMode}`);
            }
        }
        this.bsModalRef.hide();
    }

    navigateToDashboard() {
        if (this.tabGroup) {
            this.router.navigate([
                `/application/${this.appId}/tabgroup/${this.tabGroup}/dashboard/${this.dashboardId}/device/${this.deviceId}`]);
        } else {
            this.router.navigate([`/application/${this.appId}/dashboard/${this.dashboardId}/device/${this.deviceId}`]);
        }
    }
    async addClonedDashboard(application, name: string, dashboardId: string, icon: string, tabGroup: string) {
        const dashboardManagedObject = (await this.inventoryService.detail(dashboardId)).data;

        const template = dashboardManagedObject.c8y_Dashboard;

        const device = {
            name: this.deviceName,
            id: this.deviceId
        };
        let templateDashboad = [];
        templateDashboad = Object.keys(template.children);
        templateDashboad.forEach((widget) => {
            template.children[widget].config.device = device;
        });
        await this.addTemplateDashboard(application, name, icon, template, tabGroup);
    }

    async addExistingDashboard(application, name: string, dashboardId: string, icon: string, tabGroup: string) {
        const appDashboards = application.applicationBuilder.dashboards.filter(
            dashboard => dashboard.name !== name);
        application.applicationBuilder.dashboards = [
            ...appDashboards || [],
            {
                id: dashboardId,
                name,
                visibility: '',
                icon,
                ...(this.deviceId !== '' ? { deviceId: this.deviceId } : {}),
                tabGroup
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);
        await this.updateDeviceObjectForDashboards(dashboardId);

    }

    async addNewDashboard(application, name: string, icon: string, tabGroup: string) {
        await this.addTemplateDashboard(application, name, icon, {
            children: {},
            name,
            icon,
            global: true,
            priority: 10000
        }, tabGroup);
    }

    async addTemplateDashboard(application, name: string, icon: string, template: any, tabGroup: string) {
        const dashboardManagedObject = (await this.inventoryService.create({
            c8y_Dashboard: {
                ...template,
                name,
                icon,
                global: true
            }
        })).data;
        application.applicationBuilder.dashboards = [
            ...application.applicationBuilder.dashboards || [],
            {
                id: dashboardManagedObject.id,
                name,
                icon,
                tabGroup,
                ...(this.deviceId !== '' ? { deviceId: this.deviceId } : {})
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);
        await this.updateDeviceObjectForDashboards(dashboardManagedObject.id);
        this.dashboardId = dashboardManagedObject.id;
    }
    async updateDeviceObjectForDashboards(newDashboardId) {
        const deviceObj = (await this.inventoryService.detail(this.deviceId)).data as any;
        let deviceListDynamicDashboards = deviceObj.deviceListDynamicDashboards || [];
        if (deviceListDynamicDashboards.length > 0) {
            deviceListDynamicDashboards = deviceListDynamicDashboards.filter((dashboard) =>
                dashboard.appId !== this.appId ||
                dashboard.deviceGroupId !== this.groupId);
        }
        deviceListDynamicDashboards.push({
            appId: this.appId,
            deviceGroupId: this.groupId,
            templateId: (this.deviceDashboardObj ? this.deviceDashboardObj.templateId || '' : ''),
            dashboardId: newDashboardId,
            dashboardName: this.dashboardName,
            tabGroup: (this.tabGroup ? this.tabGroup || '' : '')
        });
        deviceObj.deviceListDynamicDashboards = [...deviceListDynamicDashboards];
        this.inventoryService.update({
            ...deviceObj
        }).then((res) => {
        });
    }

    async loadApplicationDashboards() {
        const appServiceData = (await this.appService.detail(this.appId)).data as any;
        if (appServiceData.applicationBuilder && appServiceData.applicationBuilder.dashboards) {
            this.dashboardNameList = Array.from(new Set(appServiceData.applicationBuilder.dashboards.map(item => item.name)));
        }
    }
}
