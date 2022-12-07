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
import { Component, Input, isDevMode, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApplicationService, IdentityService, InventoryService, UserService, IManagedObject, Realtime } from '@c8y/client';
import { AppStateService, RealtimeService } from '@c8y/ngx-components';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { GpAssetViewerService } from './gp-asset-viewer.service';
import * as ImageData from './gp-default-image';

export interface DeviceData {
  id?: string;
  name?: string;
  externalId?: string;
  externalType?: string;
  lastUpdated?: Date;
  firmwareStatus?: string;
  availability?: string;
  alertDetails?: any;
  other?: any;
  type?: any;
  firmwareName?: string;
  firmwareVersionIssues?: string;
  firmwareVersionIssuesName?: string;
  responseInterval?: string;
  connectionStatus?: string;
  communicationMode?: string;
  hardwareModel?: string;
  creationTime?: string;
  owner?: string;
  childDeviceAvailable?: any;
  notes?: any;
}

@Component({
  selector: 'lib-gp-asset-viewer',
  templateUrl: './gp-asset-viewer.component.html',
  styleUrls: ['gp-asset-viewer.component.css'],
  // encapsulation: ViewEncapsulation.None
})

export class GpAssetViewerComponent implements OnInit, OnDestroy {
  // tslint:disable-next-line:variable-name
  _config: any = {};
  otherProp: any;
  tableProps: any;
  displayMode: any;
  @Input()
  set config(config: any) {
    this._config = config;
  }
  deviceListData = [];
  isBookOpen = false;
  appId = '';
  group = '';
  configDashboardList = [];
  withTabGroup = false;
  filterValue = '';
  filterData = [];
  isBusy = false;
  realtimeState = true;
  isRuntimeExternalId = false;
  showChildDevices = false;
  displayedColumns: string[] = ['id', 'name', 'externalId', 'lastUpdated'];
  displayedColumnsForList: string[] = [];
  dynamicDisplayColumns = [];
  dataSource = new MatTableDataSource<DeviceData>([]);
  matData = [];
  defaultImageId = null;
  defaultImageURL = null;
  currentPage = 1;
  pageSize = 5;
  totalRecord = -1;
  onlyProblems = false;
  latestFirmwareVersion = 0;
  bsModalRef: BsModalRef;
  viewMode = '3';
  allSubscriptions: any = [];
  @ViewChild(MatSort, { static: false })
  set sort(v: MatSort) { this.dataSource.sort = v; }
  @ViewChild(MatTable, { static: false }) matTable: MatTable<any>;

  constructor(private inventoryService: InventoryService,
    public inventory: InventoryService,
    private realTimeService: Realtime,
    private sanitizer: DomSanitizer, private appService: ApplicationService,
    private deviceListService: GpAssetViewerService,
    private identityService: IdentityService, private router: Router, private modalService: BsModalService,
    private userService: UserService, private appStateService: AppStateService) {
  }

  async ngOnInit() {
    this.isBusy = true;
    this.appId = this.deviceListService.getAppId();
    if (!this._config.device && isDevMode()) {
      this.group = '18793';
      this._config = {
        // Sample Configuration Data
        /*  fpProps: ['Availability', 'ActiveAlarmsStatus', 'Other', 'FirmwareStatus'],
         p1Props: [
           { id: 'childDeviceAvailable', label: 'Child devices', value: 'childDeviceAvailable' },
           { id: 'id', label: 'id', value: 'id' },
           { id: 'c8y_Firmware.versionIssuesName', label: 'versionIssuesName', value: 'c8y_Firmware.versionIssuesName' },
           { id: 'c8y_Firmware.name', label: 'firmware name', value: 'c8y_Firmware.name' },
           { id: 'c8y_Availability.status', label: 'status', value: 'c8y_Availability.status' }
                 ],
         p2Props: [
           { id: 'owner', label: 'owner', value: 'owner' },
           { id: 'creationTime', label: 'creationTime', value: 'creationTime' },
           { id: 'type', label: 'type', value: 'type' },
           { id: 'lastUpdated', label: 'lastUpdated', value: 'lastUpdated' },
           { id: 'deviceExternalDetails.externalType', label: 'externalType', value: 'deviceExternalDetails.externalType' }
                 ],
         otherProp: {
           label: 'Firmware:',
           value: 'id'
         } */
      };
      this.configDashboardList = [];
      this.withTabGroup = true;
      this.onlyProblems = false;
      this.showChildDevices = false;
    } else {
      this.group = this._config.device ? this._config.device.id : '';
      this.configDashboardList = this._config.dashboardList;
      this.realtimeState = this._config.realtime ? this._config.realtime : '';
      this.withTabGroup = this._config.withTabGroup ? this._config.withTabGroup : false;
      this.isRuntimeExternalId = this._config.isRuntimeExternalId ? this._config.isRuntimeExternalId : false;
      this.defaultImageId = this._config.defaultImageId ? this._config.defaultImageId : null;
      this.pageSize = this._config.pageSize ? this._config.pageSize : this.pageSize;
      this.displayMode = this._config.displayMode ? this._config.displayMode : 'All';
      this.displayedColumnsForList = this._config.selectedInputs ? this._config.selectedInputs : ['id', 'name', 'deviceExternalDetails.externalId', 'lastUpdated', 'c8y_Availability.status', 'c8y_ActiveAlarmsStatus'];
      if (this._config.otherPropList && this._config.otherPropList.length > 0) {
        this._config.otherPropList.forEach((element) => {
          if (element.label !== '' && element.value !== '') {
            this.dynamicDisplayColumns.push(element);
            this.displayedColumnsForList = this.displayedColumnsForList.concat([element.value]);
          }
        })
      }
      if (this._config.defaultListView) {
        this.viewMode = this._config.defaultListView;
      } else {
        this.viewMode = '3';
        this._config.defaultListView = '3';
      }
      this.onlyProblems = this._config.attentionReq ? true : false;
      this.showChildDevices = this._config.showChildDevices ? true : false;
    }
    this.otherProp = this._config.otherProp ? this._config.otherProp : '';
    this.displayedColumns = this.displayedColumns.concat(this._config.fpProps ? this._config.fpProps : []);
    let index = this.displayedColumnsForList.indexOf('other');
    if (index !== -1) {
      this.displayedColumnsForList.splice(index, 1);
    }
    await this.getFirmwareData();
    this.loadDefaultImage();
  }

  loadDefaultImage() {
    if (this.defaultImageId) {
      this.deviceListService.downloadBinary(this.defaultImageId).then((res: { blob: () => Promise<any>; }) => {
        res.blob().then((blb) => {
          this.defaultImageURL = URL.createObjectURL(blb);
          this.getDevices();
        });
      });
    } else {
      this.getDevices();
    }
  }

  getTheValue(device, value: string) {
    if (typeof value === 'string' && value.includes('.')) {
      const arr = value.split('.');
      let actualValue = device[arr[0]] ? device[arr[0]] : undefined;
      if (actualValue !== undefined) {
        for (let i = 1; i < arr.length; i++) {
          actualValue = actualValue[arr[i]];
        }
      }
      return actualValue;
    }
    return device[value];
  }

  getTheValueOther(device, value: string) {
    if (typeof value === 'string' && value.includes('.')) {
      const arr = value.split('.');
      let actualValue = device[arr[0]] ? device[arr[0]] : undefined;
      if (actualValue !== undefined) {
        for (let i = 1; i < arr.length; i++) {
          actualValue = actualValue[arr[i]];
        }
      }
      return actualValue;
    }
    return JSON.stringify(device[value]);
  }

  async refresh() {
    this.clearSubscriptions();
    this.matData = [];
    this.deviceListData = [];
    this.filterData = [];
    await this.getFirmwareData();
    this.getDevices();
  }

  // Polyfill for await in forEach
  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  /**
   * This method will called during page navigation
   */
  getPageEvent(pageEvent) {
    this.currentPage = pageEvent.page;
    this.clearSubscriptions();
    this.matData = [];
    this.deviceListData = [];
    this.filterData = [];
    this.dataSource.data = this.matData;
    this.getDevices();
  }

  async getFirmwareData() {
    const firmwareData = await this.inventoryService.list({ type: 'sag_racm_currentFirmware' });
    if (firmwareData.data.length > 0) {
      this.latestFirmwareVersion = firmwareData.data[0].firmware.version;
    }
  }
  async getDevices() {
    this.isBusy = true;

    // Get list of devices for given group
    const response = await this.deviceListService.getDeviceList(this.group, this.pageSize, this.currentPage, this.showChildDevices, this.displayMode);
    if (response.data && response.data.length < this.pageSize) {
      this.totalRecord = (this.pageSize * (response.paging.totalPages - 1)) + response.data.length;
    } else {
      this.totalRecord = this.pageSize * response.paging.totalPages;
    }
    if (response.data && response.data.length > 0) {
      await this.asyncForEach(response.data, async (x) => {
        await this.loadBoxes(x);
        await this.loadMatData(x);
        let externalData;
        if (this.isRuntimeExternalId && !x.deviceExternalDetails) {
          externalData = await this.getExternalId(x.id);
          if (externalData && (!x.deviceExternalDetails || x.deviceExternalDetails.externalId !== externalData.externalId)) {
            await this.updateDeviceObjectForExternalId(x.id, externalData);
          }
        }
        if (this.realtimeState) {
          this.handleReatime(x.id);
        }
      });
      //  this.matTableLoadAndFilter();
      this.isBusy = false;
      if (this.onlyProblems) {
        this.filterProblems();
      }
    } else {
      this.isBusy = false;
    }
  }

  /**
   * Load Book views
   */
  async loadBoxes(x: any) {
    let alertDesc = {
      minor: 0,
      major: 0,
      critical: 0,
      warning: 0
    };
    const promArr = new Array();
    let availability = x.c8y_Availability ? x.c8y_Availability.status : undefined;
    alertDesc = (x.hasOwnProperty('c8y_IsAsset')) ? await this.deviceListService.getAlarmsForAsset(x) : this.checkAlarm(x, alertDesc);
    this.getAlarmAndAvailabilty(x, promArr).then((res) => {
      x.childDeviceAvailable = [];
      res.forEach(data => {
        const inventory = data.data;
        x.childDeviceAvailable.push(inventory.name);
        // tslint:disable-next-line:no-unused-expression
        alertDesc ? alertDesc = this.checkAlarm(inventory, alertDesc) : '';
        // tslint:disable-next-line:no-unused-expression
        availability ? availability = this.checkAvailabilty(inventory, availability) : '';
      });
      if (x.c8y_Firmware) {
        x.firmwareStatus = this.getFirmwareRiskForFilter(x.c8y_Firmware.version);
      }
      if (x.c8y_Availability) {
        x.availability = availability;
      }
      x.alertDetails = alertDesc;
      this.filterData.push(x);
      this.deviceListData.push(x);
    });
    this.loadAssetImage(x.image).then((image) => x._boxImage = image);
  }

  handleReatime(id) {
    // REALTIME ------------------------------------------------------------------------
    const manaogedObjectChannel = `/managedobjects/${id}`;
    const detailSubs = this.realTimeService.subscribe(
      manaogedObjectChannel,
      (resp) => {
        const data = (resp.data ? resp.data.data : {});
        this.manageRealtime(data);
      }
    );
    if (this.realtimeState) {
      this.allSubscriptions.push({
        id: id,
        subs: detailSubs,
        type: 'Realtime',
      });
    } else {
      this.realTimeService.unsubscribe(detailSubs);
    }
  }

  manageRealtime(updatedDeviceData) {
    let alertDesc = {
      minor: 0,
      major: 0,
      critical: 0,
      warning: 0
    };
    const promArr = new Array();
    let availability = updatedDeviceData.c8y_Availability ? updatedDeviceData.c8y_Availability.status : undefined;
    if (this.realtimeState) {
      const updatedRecord = this.filterData.find(singleDevice => singleDevice.id === updatedDeviceData.id);
      const updatedIndex = this.filterData.indexOf(updatedRecord);
      this.getAlarmAndAvailabilty(updatedDeviceData, promArr).then((res) => {
        res.forEach(data => {
          const inventory = data.data;
          // tslint:disable-next-line:no-unused-expression
          alertDesc ? alertDesc = this.checkAlarm(inventory, alertDesc) : '';
          // tslint:disable-next-line:no-unused-expression
          availability ? availability = this.checkAvailabilty(inventory, availability) : '';
        });
        if (updatedDeviceData.c8y_Firmware) {
          updatedDeviceData.firmwareStatus = this.getFirmwareRiskForFilter(updatedDeviceData.c8y_Firmware.version);
        }
        if (updatedDeviceData.c8y_Availability) {
          updatedDeviceData.availability = availability;
        }
        updatedDeviceData.alertDetails = alertDesc;
      });
      this.filterData[updatedIndex] = updatedDeviceData;
      this.matData = [...this.matData.filter(device => device.id !== updatedDeviceData.id)];
      this.loadMatData(updatedDeviceData);
      this.dataSource.data = this.matData;
      this.dataSource.sort = this.sort;
      this.applyFilter();
    }
  }

  // Load data for material table
  async loadMatData(x: any) {
    let alertDesc = {
      minor: 0,
      major: 0,
      critical: 0,
      warning: 0
    };

    const promArr = new Array();
    let availability = x.c8y_Availability ? x.c8y_Availability.status : undefined;
    //let connectionStatus = x.c8y_Connection ? x.c8y_Connection.status : undefined;

    alertDesc = (x.hasOwnProperty('c8y_IsAsset')) ? await this.deviceListService.getAlarmsForAsset(x) : this.checkAlarm(x, alertDesc);
    this.getAlarmAndAvailabilty(x, promArr).then((res) => {
      const deviceData: DeviceData = {};
      res.forEach(data => {
        const inventory = data.data;
        // tslint:disable-next-line:no-unused-expression
        alertDesc ? alertDesc = this.checkAlarm(inventory, alertDesc) : '';
        // tslint:disable-next-line:no-unused-expression
        availability ? availability = this.checkAvailabilty(inventory, availability) : '';
      });

      deviceData.id = x.id;
      deviceData.name = x.name;
      deviceData.type = x.type;
      deviceData.lastUpdated = x.lastUpdated;
      deviceData.creationTime = x.creationTime;
      deviceData.owner = x.owner ? x.owner : 'Not available';
      if (x.childDeviceAvailable) {
        deviceData.childDeviceAvailable = x.childDeviceAvailable;
      }
      if (x.deviceExternalDetails) {
        deviceData.externalId = x.deviceExternalDetails.externalId ? x.deviceExternalDetails.externalId : 'Not available';
      } else {
        deviceData.externalId = 'Not available';
      }
      if (x.deviceExternalDetails) {
        deviceData.externalType = x.deviceExternalDetails.externalType ? x.deviceExternalDetails.externalType : 'Not available';
      } else {
        deviceData.externalType = 'Not available';
      }
      if (x.c8y_RequiredAvailability) {
        deviceData.responseInterval = x.c8y_RequiredAvailability.responseInterval ? x.c8y_RequiredAvailability.responseInterval : 'Not available';
      } else {
        deviceData.responseInterval = 'Not available';
      }
      if (x.c8y_Connection) {
        deviceData.connectionStatus = x.c8y_Connection.status ? x.c8y_Connection.status : 'Not available';
      } else {
        deviceData.connectionStatus = 'Not available';
      }
      if (x.c8y_CommunicationMode) {
        deviceData.communicationMode = x.c8y_CommunicationMode.mode ? x.c8y_CommunicationMode.mode : 'Not availble';
      } else {
        deviceData.communicationMode = 'Not available';
      }
      if (x.c8y_Hardware) {
        deviceData.hardwareModel = x.c8y_Hardware.model ? x.c8y_Hardware.model : 'Not available';
      } else {
        deviceData.hardwareModel = 'Not available';
      }
      if (x.c8y_Notes) {
        deviceData.notes = x.c8y_Notes;
      } else {
        deviceData.notes = 'Not available';
      }
      if (this._config.selectedInputs) {
        this._config.selectedInputs.forEach(element => {
          if (x.c8y_Firmware && element === 'c8y_Firmware.version') {
            deviceData.firmwareStatus = x.c8y_Firmware.version ? this.getFirmwareRiskForFilter(x.c8y_Firmware.version) : 'Not available';
          } else {
            deviceData.firmwareStatus = 'Not available';
          }
          if (x.c8y_Firmware && element === 'c8y_Firmware.name') {
            deviceData.firmwareName = x.c8y_Firmware.name ? x.c8y_Firmware.name : 'Not available';
          } else {
            deviceData.firmwareName = 'Not available';
          }
          if (x.c8y_Firmware && element === 'c8y_Firmware.versionIssues') {
            deviceData.firmwareVersionIssues = x.c8y_Firmware.versionIssues ? x.c8y_Firmware.versionIssues : 'Not available';
          } else {
            deviceData.firmwareVersionIssues = 'Not available';
          }
          if (x.c8y_Firmware && element === 'c8y_Firmware.versionIssuesName') {
            deviceData.firmwareVersionIssuesName = x.c8y_Firmware.versionIssuesName ? x.c8y_Firmware.versionIssuesName : 'Not available';
          } else {
            deviceData.firmwareVersionIssuesName = 'Not available';
          }
          if (x.c8y_Availability && element === 'c8y_Availability.status') {
            deviceData.availability = availability;
          }
          if (element === 'ActiveAlarmsStatus') {
            deviceData.alertDetails = alertDesc;
          }
          if (element === 'c8y_ActiveAlarmsStatus') {
            deviceData.alertDetails = alertDesc;
          }
          if (element === 'Other' && this.getTheValue(x, this.otherProp.value) !== undefined) {
            deviceData.other = this.getTheValue(x, this.otherProp.value);
            deviceData.other = JSON.stringify(deviceData.other);
          }
  
          if (element === 'other' && this.getTheValue(x, this.otherProp.value) !== undefined) {
            deviceData.other = this.getTheValue(x, this.otherProp.value);
            deviceData.other = JSON.stringify(deviceData.other);
          }
        });
      } else {
        if (x.c8y_Availability) {
          deviceData.availability = availability;
        }
        if (alertDesc) {
          deviceData.alertDetails = alertDesc;
        }
      }
      this.dynamicDisplayColumns.forEach(element => {
        deviceData[element.value] = this.getTheValue(x, element.value);
        deviceData[element.value] = JSON.stringify(this.getTheValue(x, element.value));
      });
      this.matData.push(deviceData);
      this.matTableLoadAndFilter();
    });
  }

  getAlarmAndAvailabilty(device?: any, promArr?: any[]): any {

    if (device.childDevices.references.length > 0) {
      device.childDevices.references.forEach(async dev => {
        promArr.push(this.inventoryService.detail(dev.managedObject.id));
      });
    }
    return Promise.all(promArr);
  }

  checkAvailabilty(inventory, availability): any {
    if (inventory.c8y_Availability && inventory.c8y_Availability.status) {
      inventory.c8y_Availability.status === 'UNAVAILABLE'
        // tslint:disable-next-line:no-unused-expression
        ? availability = 'UNAVAILABLE' : '';
    }
    return availability;
  }

  checkAlarm(inventory: IManagedObject, alertDesc: any): any {
    if (inventory.c8y_ActiveAlarmsStatus) {
      if (inventory.c8y_ActiveAlarmsStatus.hasOwnProperty('minor')) {
        if (inventory.c8y_ActiveAlarmsStatus.minor > 0) {
          alertDesc.minor += inventory.c8y_ActiveAlarmsStatus.minor;
        }
      }
      if (inventory.c8y_ActiveAlarmsStatus.hasOwnProperty('major')) {
        if (inventory.c8y_ActiveAlarmsStatus.major > 0) {
          alertDesc.major += inventory.c8y_ActiveAlarmsStatus.major;
        }
      }
      if (inventory.c8y_ActiveAlarmsStatus.hasOwnProperty('critical')) {
        if (inventory.c8y_ActiveAlarmsStatus.critical > 0) {
          alertDesc.critical += inventory.c8y_ActiveAlarmsStatus.critical;
        }
      }
      if (inventory.c8y_ActiveAlarmsStatus.hasOwnProperty('warning')) {
        if (inventory.c8y_ActiveAlarmsStatus.warning > 0) {
          alertDesc.warning += inventory.c8y_ActiveAlarmsStatus.warning;
        }
      }
    }
    return alertDesc;
  }

  matTableLoadAndFilter() {
    this.dataSource.data = this.matData;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = ((x: any, filterValue: string) => this.matFilterConditions(x, filterValue));
  }

  // Filter conditioan for Material Table
  matFilterConditions(x: any, filterValue) {
    return !filterValue || x.id.includes(filterValue) ||
      x.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      (x.externalId && x.externalId.toLowerCase().includes(filterValue.toLowerCase())) ||
      (x.availability && x.availability.toLowerCase().includes(filterValue.toLowerCase())) ||
      (x.firmwareStatus && x.firmwareStatus.toLowerCase().includes(filterValue.toLowerCase())) ||
      (x.alertDetails && this.isAlerts(x.alertDetails) && (
        this.isAlertCritical(x.alertDetails) && 'critical'.includes(filterValue.toLowerCase()) ||
        this.isAlertMajor(x.alertDetails) && 'major'.includes(filterValue.toLowerCase()) ||
        this.isAlertMinor(x.alertDetails) && 'minor'.includes(filterValue.toLowerCase()) ||
        this.isAlertWarning(x.alertDetails) && 'warning'.includes(filterValue.toLowerCase())
      )
      );
  }

  // Realtime toggle
  toggle() {
    this.realtimeState = !this.realtimeState;
    if (this.realtimeState) {
      this.filterData.forEach(x => {
        this.handleReatime(x.id);
      });
    } else {
      this.clearSubscriptions();
    }
  }

  async getExternalId(deviceId) {
    const identity = await this.identityService.list(deviceId);
    return (identity.data[0] ? identity.data[0] : undefined);
  }


  async loadAssetImage(image): Promise<SafeResourceUrl> {
    if (!image && !this.defaultImageId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/png;base64,' + ImageData.defaultImage);
    }

    if (!image && this.defaultImageId) {
      this.sanitizer.bypassSecurityTrustResourceUrl(this.defaultImageURL);
    }

    // if content of image variable is a number it is assumed it is a binary id
    // and therefore the corresponding image is loaded from the binary repository
    if (image && Number(image)) {
      const response = await this.deviceListService.downloadBinary(image) as Response;
      const binaryBlob = await response.blob();
      return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(binaryBlob));
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/png;base64,' + image);
  }

  // Navigate URL to dashboard if dashboard is exist
  navigateURL(deviceId: string, deviceType: string) {
    if (deviceType && this.appId) {
      const dashboardObj = this.configDashboardList.find((dashboard) => dashboard.type === deviceType);
      if (dashboardObj && dashboardObj.templateID) {
        if (dashboardObj.withTabGroup) {
          this.router.navigate([
            `/application/${this.appId}/tabgroup/${deviceId}/dashboard/${dashboardObj.templateID}/device/${deviceId}`]);
        } else if (dashboardObj.tabGroupID) {
          this.router.navigate([
            `/application/${this.appId}/tabgroup/${dashboardObj.tabGroupID}/dashboard/${dashboardObj.templateID}/device/${deviceId}`]);
        } else {
          this.router.navigate([`/application/${this.appId}/dashboard/${dashboardObj.templateID}/device/${deviceId}`]);
        }
      }
    } else if (deviceType) {
      this.router.navigate([`/device/${deviceId}`]);
    }
  }

  loadText(alarm) {
    let alarmsStatus = '';
    if (alarm) {
      if (alarm.critical && alarm.critical > 0) {
        alarmsStatus = alarmsStatus + `Critical: ${alarm.critical} `;
      }
      if (alarm.major && alarm.major > 0) {
        alarmsStatus = alarmsStatus + `Major: ${alarm.major} `;
      }
      if (alarm.minor && alarm.minor > 0) {
        alarmsStatus = alarmsStatus + `Minor: ${alarm.minor} `;
      }
      if (alarm.warning && alarm.warning > 0) {
        alarmsStatus = alarmsStatus + `Warning: ${alarm.warning} `;
      }
    }
    return alarmsStatus;
  }

  isAlerts(alarm) {
    if (alarm === undefined) { return false; }

    return (alarm.critical && alarm.critical > 0) || (alarm.major && alarm.major > 0)
      || (alarm.minor && alarm.minor > 0)
      || (alarm.warning && alarm.warning > 0);
  }

  isAlertsColor(alarm) {
    if (alarm) {
      if (alarm.critical && alarm.critical > 0) {
        return 'criticalAlerts2';
      } else if (alarm.major && alarm.major > 0) {
        return 'majorAlerts2';
      } else if (alarm.minor && alarm.minor > 0) {
        return 'minorAlerts2';
      } else if (alarm.warning && alarm.warning > 0) {
        return 'warningAlerts2';
      } else {
        return '';
      }
    }
    return '';
  }

  isAlertsBGColor(alarm) {
    if (alarm) {
      if (alarm.critical && alarm.critical > 0) {
        return 'criticalAlerts';
      } else if (alarm.major && alarm.major > 0) {
        return 'majorAlerts';
      } else if (alarm.minor && alarm.minor > 0) {
        return 'minorAlerts';
      } else if (alarm.warning && alarm.warning > 0) {
        return 'warningAlerts';
      } else {
        return '';
      }
    }
    return '';
  }

  getTotalAlerts(alarm) {
    let alertCount = 0;
    if (alarm) {
      if (alarm.critical && alarm.critical > 0) {
        alertCount += alarm.critical;
      }
      if (alarm.major && alarm.major > 0) {
        alertCount += alarm.major;
      }
      if (alarm.minor && alarm.minor > 0) {
        alertCount += alarm.minor;
      }
      if (alarm.warning && alarm.warning > 0) {
        alertCount += alarm.warning;
      }
    }
    return alertCount;
  }
  isAlertCritical(alarm) {
    return (alarm && alarm.critical && alarm.critical > 0);
  }
  isAlertMajor(alarm) {
    return (alarm && alarm.major && alarm.major > 0);
  }
  isAlertMinor(alarm) {
    return (alarm && alarm.minor && alarm.minor > 0);
  }
  isAlertWarning(alarm) {
    return (alarm && alarm.warning && alarm.warning > 0);
  }

  async updateDeviceObjectForExternalId(newdeviceId, externalData) {
    const deviceObj = (await this.inventoryService.detail(newdeviceId)).data as any;
    await this.inventoryService.update({
      deviceExternalDetails: {
        externalId: externalData.externalId,
        externalType: externalData.type,
      },
      ...deviceObj
    });
  }

  applyFilter() {
    if (this.filterValue) {
      this.filterData = this.filterData.filter(x => {
        return x.id.includes(this.filterValue) ||
          x.name.toLowerCase().includes(this.filterValue.toLowerCase()) ||
          (x.deviceExternalDetails && x.deviceExternalDetails.externalId.toLowerCase().includes(this.filterValue.toLowerCase())) ||
          (x.availability && x.availability.toLowerCase().includes(this.filterValue.toLowerCase())) ||
          (x.c8y_Firmware && x.c8y_Firmware.version &&
            this.getFirmwareRiskForFilter(x.c8y_Firmware.version).toLowerCase().includes(this.filterValue.toLowerCase())) ||
          (x.alertDetails && this.isAlerts(x.alertDetails) && (
            this.isAlertCritical(x.alertDetails) && 'critical'.includes(this.filterValue.toLowerCase()) ||
            this.isAlertMajor(x.alertDetails) && 'major'.includes(this.filterValue.toLowerCase()) ||
            this.isAlertMinor(x.alertDetails) && 'minor'.includes(this.filterValue.toLowerCase()) ||
            this.isAlertWarning(x.alertDetails) && 'warning'.includes(this.filterValue.toLowerCase())
          ));
      });
    } else {
      this.filterData = this.deviceListData;
    }
    this.dataSource.filter = this.filterValue;
    if (this.onlyProblems) {
      this.filterProblems();
    }
  }

  // Filter between all records or only for "Attention required"
  filterProblems() {
    if (this.onlyProblems) {
      this.filterData = this.filterData.filter(x => {
        return this.toggleFilter(x);
      });
      this.filterValue = this.filterValue;
      this.dataSource.data = this.matData.filter(x => this.matToggleFilter(x));
      if (this.matTable) { this.matTable.renderRows(); }
    } else {
      this.dataSource.data = this.matData;
      if (this.matTable) { this.matTable.renderRows(); }
      this.applyFilter();
    }

  }

  // applied when Attention Required toggle is trigger
  toggleFilter(x: any) {
    return (this.checkPropForFilter('availability') && x.availability && x.availability.toLowerCase().includes('unavailable')) ||
      (this.checkPropForFilter('availability') && x.availability && x.availability.toLowerCase().includes('partial')) ||
      (this.checkPropForFilter('firmwarestatus') && x.c8y_Firmware && x.c8y_Firmware.version &&
        (this.getFirmwareRiskForFilter(x.c8y_Firmware.version).toLowerCase().includes('low') ||
          this.getFirmwareRiskForFilter(x.c8y_Firmware.version).toLowerCase().includes('medium') ||
          this.getFirmwareRiskForFilter(x.c8y_Firmware.version).toLowerCase().includes('high')
        )) ||
      (this.checkPropForFilter('activealarmsstatus') && x.alertDetails && this.isAlerts(x.alertDetails) && (
        this.isAlertCritical(x.alertDetails) ||
        this.isAlertMajor(x.alertDetails) ||
        this.isAlertMinor(x.alertDetails) ||
        this.isAlertWarning(x.alertDetails)
      ));
  }

  private checkPropForFilter(propertyKey) {
    if (this._config && this._config.fpProps) {
      const propObj = this._config.fpProps.find(prop => prop.toLowerCase() === propertyKey);
      if (propObj) { return true; }
    }
    return false;
  }

  // applied when Attention Required toggle is trigger
  matToggleFilter(x: any) {
    return (this.checkPropForFilter('availability') && x.availability && x.availability.toLowerCase().includes('unavailable')) ||
      (this.checkPropForFilter('availability') && x.availability && x.availability.toLowerCase().includes('partial')) ||
      (this.checkPropForFilter('firmwarestatus') && x.firmwareStatus && (x.firmwareStatus.toLowerCase().includes('low') ||
        x.firmwareStatus.toLowerCase().includes('medium') ||
        x.firmwareStatus.toLowerCase().includes('high'))) ||
      (this.checkPropForFilter('activealarmsstatus') && x.alertDetails && this.isAlerts(x.alertDetails) && (
        this.isAlertCritical(x.alertDetails) ||
        this.isAlertMajor(x.alertDetails) ||
        this.isAlertMinor(x.alertDetails) ||
        this.isAlertWarning(x.alertDetails)
      ));
  }

  // Only for developement purpose
  async cleanDeviceObjectForDashboards(deviceId) {
    const deviceObj = (await this.inventoryService.detail(deviceId)).data as any;
    let deviceListDynamicDashboards = deviceObj.deviceListDynamicDashboards || [];
    deviceListDynamicDashboards = [];
    deviceObj.deviceListDynamicDashboards = [...deviceListDynamicDashboards];
    this.inventoryService.update({
      ...deviceObj
    });
  }

  calculateFirmwareRisk(version) {
    let versionIssues = 0;
    versionIssues = version - this.latestFirmwareVersion;
    return versionIssues;
  }

  getFirmwareRisk(version) {
    const versionIssue = this.calculateFirmwareRisk(version);
    if (versionIssue === -1) {
      return 'Low';
    } else if (versionIssue === -2) {
      return 'Medium';
    } else if (versionIssue === -3) {
      return 'High';
    }
  }

  getFirmwareRiskForFilter(version) {
    const versionIssue = this.calculateFirmwareRisk(version);
    if (versionIssue === -1) {
      return 'Low  Risk';
    } else if (versionIssue === -2) {
      return 'Medium Risk';
    } else if (versionIssue === -3) {
      return 'High Risk';
    } else {
      return 'No Risk';
    }
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }

  /**
   * Clear all Realtime subscriptions
   */
  private clearSubscriptions() {
    if (this.allSubscriptions) {
      this.allSubscriptions.forEach((s) => {
        this.realTimeService.unsubscribe(s.subs);
      });
    }
  }
}
