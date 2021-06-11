import { Component, Input, isDevMode, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ApplicationService, IdentityService, InventoryService, UserService, IManagedObject } from '@c8y/client';
import { AppStateService } from '@c8y/ngx-components';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { GpAssetOverviewAppIdService } from './gp-asset-overview-app-id.service';
import { GpAssetViewerService } from './gp-asset-viewer.service';
import * as ImageData from './gp-default-image';
import { NewDashboardModalComponent } from './new-dashboard-modal.component';

export interface DeviceData {
  id?: string;
  name?: string;
  externalId?: string;
  lastUpdated?: Date;
  firmwareStatus?: string;
  availability?: string;
  alertDetails?: any;
  other?: any;
}

@Component({
  selector: 'lib-gp-asset-viewer',
  templateUrl: './gp-asset-viewer.component.html',
  styleUrls: ['gp-asset-viewer.component.css'],
  // encapsulation: ViewEncapsulation.None
})
export class GpAssetViewerComponent implements OnInit, OnDestroy {
  // tslint:disable-next-line:variable-name
  _config: any = {}; // {} needs to be removed
  otherProp: any;
  tableProps: any;
  @Input()
  set config(config: any) {
    this._config = config;
  }
  deviceListData = [];
  isBookOpen = false;
  dashboardIcon = 'th';
  appId = '23531' ; // '13996';
  group = '2313610'; // 129 ; // 129; // 48079956 ; this.config.groupId;
  configDashboardList = [];
  withTabGroup = false;
//  widgetId = '012121'; // ''; 698834
  filterValue = '';
  filterData = [];
  isBusy = false;
  realtimeState = true;
  isRuntimeExternalId = false;
  displayedColumns: string[] = ['id', 'name', 'externalId', 'lastUpdated'];
  dataSource = new  MatTableDataSource<DeviceData>([]);
  matData = [];
  defaultImageId = null;
  defaultImageURL = null;
  currentPage = 1;
  pageSize = 5;
  totalRecord = -1;
  onlyProblems = false;
  latestFirmwareVersion = 0;
  showDashboardConfig = false;
  unsubscribeRealTime$ = new Subject<void>();
  bsModalRef: BsModalRef;

  @ViewChild(MatSort, { static: false })
  set sort(v: MatSort) { this.dataSource.sort = v; }
  @ViewChild(MatTable, { static: false }) matTable: MatTable<any>;

  constructor(private inventoryService: InventoryService,
              public inventory: InventoryService,
              private sanitizer: DomSanitizer, private appService: ApplicationService,
              private deviceListService: GpAssetViewerService,
              private identityService: IdentityService, private router: Router, private modalService: BsModalService,
              private userService: UserService, private appStateService: AppStateService,
              private appIdService: GpAssetOverviewAppIdService) {
    }

  async ngOnInit() {
    this.appId = this.appIdService.getCurrentAppId();
    if (!this._config.device && isDevMode()) {
      this.group = '2313610';
      this._config = {
        fpProps : ['Availability', 'ActiveAlarmsStatus', 'Other'],
        p1Props : [
                  {id: 'childDeviceAvailable', label: 'Child devices', value: 'childDeviceAvailable'},
                  {id: 'id', label: 'id', value: 'id'},
                  {id: 'c8y_Firmware.versionIssuesName', label: 'versionIssuesName', value: 'c8y_Firmware.versionIssuesName'},
                  {id: 'c8y_Firmware.name', label: 'firmware name', value: 'c8y_Firmware.name'},
                  {id: 'c8y_Availability.status', label: 'status', value: 'c8y_Availability.status'}
                ],
        p2Props : [
                  {id: 'owner', label: 'owner', value: 'owner'},
                  {id: 'creationTime', label: 'creationTime', value: 'creationTime'},
                  {id: 'type', label: 'type', value: 'type'},
                  {id: 'lastUpdated', label: 'lastUpdated', value: 'lastUpdated'},
                  {id: 'deviceExternalDetails.externalType', label: 'externalType', value: 'deviceExternalDetails.externalType'}
                ],
        otherProp: {
          label: 'Firmware:',
          value: 'id'
        }
      };
      this.configDashboardList = [
       // { type: 'Test_Camera', templateID: '2313611', tabGroup: 'DemoTab', dashboardName: 'type1/'},
       // { type: 'Test_Beacon', templateID: '2313612', tabGroup: 'DemoGroup2', dashboardName: 'type2_demo1/'},
       //  { type: 'All', templateID: '2313615',  dashboardName: 'type2_demo1/' }

      ];
      this.withTabGroup = true;
      this.appId = '23531';
     // this.defaultImageId = '2559607';
    } else {
      this.group = this._config.device ? this._config.device.id : '';
      this.configDashboardList = this._config.dashboardList;
      this.realtimeState =  this._config.realtime ? this._config.realtime : '';
      this.withTabGroup = this._config.withTabGroup ? this._config.withTabGroup : false;
      this.isRuntimeExternalId = this._config.isRuntimeExternalId ? this._config.isRuntimeExternalId : false;
      this.defaultImageId = this._config.defaultImageId ? this._config.defaultImageId : null;
      this.pageSize = this._config.pageSize ? this._config.pageSize : this.pageSize;
    }
    this.otherProp = this._config.otherProp ? this._config.otherProp : '';
    this.displayedColumns = this.displayedColumns.concat(this._config.fpProps ? this._config.fpProps : []);
    await this.getFirmwareData();
    this.loadDefaultImage();
    if (this._config.configDashboard && this.appId && this.hasAdminRole()) {
      this.showDashboardConfig = true;
    }
  }

  loadDefaultImage() {
    if (this.defaultImageId) {
      this.deviceListService.downloadBinary(this.defaultImageId).then((res: { blob: () => Promise<any>; }) => {
        res.blob().then((blb) => {
          this.defaultImageURL = URL.createObjectURL(blb);
          this.getDevices();
          console.log(this.defaultImageURL);
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

  async refresh() {
    this.unsubscribeRealTime$.next();
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

  getPageEvent(pageEvent) {
    console.log('page Index = ' + pageEvent.pageIndex);
    this.pageSize = pageEvent.pageSize;
    this.currentPage = pageEvent.pageIndex + 1;
    this.unsubscribeRealTime$.next();
    this.matData = [];
    this.deviceListData = [];
    this.filterData = [];
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
    const response = await this.deviceListService.getDeviceList(this.group, this.pageSize, this.currentPage);
    if (response.data && response.data.length < this.pageSize) {
       this.totalRecord = (this.pageSize * (response.paging.totalPages - 1)) + response.data.length;
     } else {
       this.totalRecord = this.pageSize * response.paging.totalPages;
     }
    await this.asyncForEach(response.data, async (x) => {
        await this.loadBoxes(x);
        await this.loadMatData(x);
        let externalData;
        if (this.isRuntimeExternalId || !x.deviceExternalDetails) {
          externalData = await this.getExternalId(x.id);
          if (externalData && (!x.deviceExternalDetails || x.deviceExternalDetails.externalId !== externalData.externalId)) {
            await this.updateDeviceObjectForExternalId(x.id, externalData);
          }
       }
        // this.cleanDeviceObjectForDashboards(x.id);
        if (this.hasAdminRole() && this.appId ) {
        // if (false) {
          const configDashboard = this.configDashboardList.find((deviceDB) =>
            (deviceDB.type === 'All' && deviceDB.templateID) || (deviceDB.type === x.type && deviceDB.templateID)) ;
          if (configDashboard && (!x.deviceListDynamicDashboards || x.deviceListDynamicDashboards.length === 0)) {
            //  console.log('create template for dashboard');
            const externalId = (externalData ? externalData.externalId :
              (x.deviceExternalDetails ? x.deviceExternalDetails.externalId : ''));
            await this.addClonedDashboard(configDashboard.dashboardName,
              configDashboard.templateID, this.dashboardIcon, x.name, x.id, externalId + ' ' + x.name,
              (this.withTabGroup ? externalId : ''));
          } else if (configDashboard) {
            const currentDashbordObj = x.deviceListDynamicDashboards.find((dashboard: any) => dashboard.appId === this.appId &&
              dashboard.deviceGroupId === this.group);
            // const configDashboardObj = this.configDashboardList.find((deviceDB) => deviceDB.type === x.type);
            if (!currentDashbordObj || (currentDashbordObj && currentDashbordObj.templateId !== configDashboard.templateID)) {
              //   console.log('template changed or does not exist');
              const externalId = (externalData ? externalData.externalId :
                (x.deviceExternalDetails ? x.deviceExternalDetails.externalId : ''));
              await this.addClonedDashboard(configDashboard.dashboardName,
                configDashboard.templateID, this.dashboardIcon, x.name, x.id, externalId + ' ' + x.name,
                (this.withTabGroup ? externalId : ''));
            } else if (currentDashbordObj && currentDashbordObj.dashboardName !== configDashboard.dashboardName) {
             //  console.log('update only dashboard name');
              await this.updateApplicationDashboards(currentDashbordObj.dashboardId,
                (x.deviceExternalDetails ? x.deviceExternalDetails.externalId + ' ' + x.name : x.name), x.id,
                configDashboard.dashboardName, (this.withTabGroup ? x.deviceExternalDetails.externalId : ''));
            }
          }
       }
        if (this.realtimeState) {
          this.handleReatime(x.id);
        }
        this.matTableLoadAndFilter();
        this.isBusy = false;
    });
  }

  loadBoxes(x: any) {
    let alertDesc = {
      minor: 0,
      major: 0,
      critical: 0,
      warning: 0
    };
    const promArr = new Array();
    let availability = x.c8y_Availability ? x.c8y_Availability.status : undefined;
    alertDesc = this.checkAlarm(x, alertDesc);
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
  }

  // show dialog box to create new dashboard
  showCreateDashboardDialog(deviceListDynamicDashboards: any, deviceId: string, deviceName: string) {
    let deviceDashboardObj = {};
    if (this.hasAdminRole() && this.appId) {
      if (deviceListDynamicDashboards && deviceListDynamicDashboards.length > 0) {
        deviceDashboardObj = deviceListDynamicDashboards.find((dashboard) => dashboard.appId === this.appId &&
          dashboard.deviceGroupId === this.group);
      }
      this.bsModalRef = this.modalService.show(NewDashboardModalComponent, {
        class: 'c8y-wizard', initialState: { deviceDashboardObj, appId: this.appId, deviceId,
          groupId: this.group, deviceName }
      });
    }
  }

  // Check if current user is has adming access
  hasAdminRole() {
    return (this.userService.hasAllRoles(this.appStateService.currentUser.value,
       ['ROLE_INVENTORY_ADMIN', 'ROLE_APPLICATION_MANAGEMENT_ADMIN']));
  }

  handleReatime(id) {
     this.inventoryService.detail$(id, {
          hot: true,
          realtime: true
        })
        .pipe(skip(1))
        .pipe(takeUntil(this.unsubscribeRealTime$)) // skiping first instance since we already get latest data from init call
        .subscribe((data) => {
            this.manageRealtime(data[0]);
    });
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
      this.matData = [...this.matData.filter( device => device.id !== updatedDeviceData.id)];
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
    alertDesc = this.checkAlarm(x, alertDesc);
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
      deviceData.lastUpdated = x.lastUpdated;
      if (x.deviceExternalDetails) {
        deviceData.externalId = x.deviceExternalDetails.externalId;
      }
      this._config.fpProps.forEach(element => {
        if (x.c8y_Firmware && element === 'FirmwareStatus') {
          deviceData.firmwareStatus = this.getFirmwareRiskForFilter(x.c8y_Firmware.version);
        }
        if (x.c8y_Availability && element === 'Availability') {
          deviceData.availability = availability;
        }
        if (element === 'ActiveAlarmsStatus') {
          deviceData.alertDetails = alertDesc;
        }
        if (element === 'Other' && this.getTheValue(x, this.otherProp.value) !== undefined) {
          deviceData.other = this.getTheValue(x, this.otherProp.value);
        }
    });
      this.matData.push(deviceData);
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
      ? availability = 'Partial' : '';
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
      (x.externalId.toLowerCase().includes(filterValue.toLowerCase())) ||
      (x.availability.toLowerCase().includes(filterValue.toLowerCase())) ||
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
      this.unsubscribeRealTime$.next();
    }
  }

  async getExternalId(deviceId) {
    const identity = await this.identityService.list(deviceId);
    return (identity.data[0] ? identity.data[0] : undefined);
  }
  getImage(image) {
    if (image) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/png;base64,' + image);
    } else if (this.defaultImageURL) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.defaultImageURL);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl('data:image/png;base64,' + ImageData.defaultImage);
  }

  // Navigate URL to dashboard if dashboard is exist else it will redirect to dialog box to create new Dasboard
  navigateURL(deviceListDynamicDashboards: any, deviceId: string, deviceName: string) {
    if (deviceListDynamicDashboards) {
      const dashboardObj = deviceListDynamicDashboards.find((dashboard) => dashboard.appId === this.appId &&
        dashboard.deviceGroupId === this.group);
      if (dashboardObj && dashboardObj.dashboardId) {
        if (dashboardObj.tabGroup) {
          this.router.navigate([
            `/application/${this.appId}/tabgroup/${dashboardObj.tabGroup}/dashboard/${dashboardObj.dashboardId}/device/${deviceId}`]);
        } else {
          this.router.navigate([`/application/${this.appId}/dashboard/${dashboardObj.dashboardId}/device/${deviceId}`]);
        }
      } else {
        this.showCreateDashboardDialog(deviceListDynamicDashboards, deviceId, deviceName);
      }
    } else {
      this.showCreateDashboardDialog(deviceListDynamicDashboards, deviceId, deviceName);
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
    if (alarm ===  undefined) {return false; }

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

  async addClonedDashboard(dashboardName: string, templateId: string, icon: string,
                           newdevicename: string, newdeviceId: string, externalId: string, tabGroup: string) {
    const dashboardManagedObject = (await this.inventoryService.detail(templateId)).data;
    const template = dashboardManagedObject.c8y_Dashboard;
    await this.addTemplateDashboard(dashboardName, icon, template, newdevicename, newdeviceId, externalId, tabGroup, templateId);
  }

  async addTemplateDashboard(dashboardName: string, icon: string, template: any, newdevicename: string,
                             newdeviceId: string, externalId: string, tabGroup: string, templateId: string) {
    const device = {
      name: newdevicename,
      id: newdeviceId
    };
    let templateDashboad = [];
    templateDashboad = Object.keys(template.children);
    templateDashboad.forEach((widget) => {
      template.children[widget].config.device = device;
    });
    const dashboardNameWithId = dashboardName + externalId;
    const dashboardManagedObject = (await this.inventoryService.create({
      c8y_Dashboard: {
        ...template,
        name: dashboardNameWithId,
        icon,
        global: true
      }
    })).data;
    const newDashboardId = dashboardManagedObject.id;
  //  await this.updateDeviceObjectForDashboard(newdeviceId, newDashboardId);
    await this.updateDeviceObjectForDashboards(newdeviceId, newDashboardId, dashboardName, templateId, tabGroup);
    const appServiceData = (await this.appService.detail(this.appId)).data as any;
    appServiceData.applicationBuilder.dashboards = [
      ...appServiceData.applicationBuilder.dashboards || [],
      {
        id: dashboardManagedObject.id,
        name: dashboardNameWithId,
        icon,
        tabGroup: (tabGroup ? tabGroup : ''),
        ...(newdeviceId !== '' ? { deviceId: newdeviceId } : {})
      }
    ];
    this.appService.update({
      id: appServiceData.id,
      applicationBuilder: appServiceData.applicationBuilder
    } as any).then (data => {
    });
  }

  async updateApplicationDashboards(dashboardId: string, externalId: string, newdeviceId: string, dashboardName: string, tabGroup: string) {
    const dashboardNamewithId = dashboardName + externalId;
    const appServiceData = (await this.appService.detail(this.appId)).data as any;
    const listOfDashboards = appServiceData.applicationBuilder.dashboards.filter((dashboard) => dashboard.id !== dashboardId);
    listOfDashboards.push(
      {
        id: dashboardId,
        name: dashboardNamewithId,
        icon: this.dashboardIcon,
        tabGroup: (tabGroup ? tabGroup : ''),
        ...(newdeviceId !== '' ? { deviceId: newdeviceId } : {})
      }
    );
    appServiceData.applicationBuilder.dashboards = listOfDashboards;
    this.appService.update({
      id: appServiceData.id,
      applicationBuilder: appServiceData.applicationBuilder
    } as any);
  }
  async updateDeviceObjectForDashboards(newdeviceId, newDashboardId, dashboardName, templateId, tabGroup) {
    const deviceObj = (await this.inventoryService.detail(newdeviceId)).data as any;
    let deviceListDynamicDashboards = deviceObj.deviceListDynamicDashboards || [];
    if (deviceListDynamicDashboards.length > 0) {
      deviceListDynamicDashboards = deviceListDynamicDashboards.filter((dashboard) => dashboard.appId !== this.appId ||
        dashboard.deviceGroupId !== this.group );
    }
    deviceListDynamicDashboards.push({
      appId: this.appId,
      deviceGroupId: this.group,
      templateId,
      dashboardId: newDashboardId,
      dashboardName,
      tabGroup: (tabGroup ? tabGroup || '' : '')
    });
    deviceObj.deviceListDynamicDashboards = [...deviceListDynamicDashboards];
    this.inventoryService.update({
      ...deviceObj
    }).then((res) => {
      this.updateDeviceList(res, newdeviceId);
    });
  }
  async updateDeviceObjectForExternalId(newdeviceId, externalData) {
    const deviceObj = (await this.inventoryService.detail(newdeviceId)).data as any;
    this.inventoryService.update({
      deviceExternalDetails: {
        externalId: externalData.externalId,
        externalType: externalData.type,
      },
      ...deviceObj
    }).then((res) => {
      this.updateDeviceList(res, newdeviceId);
    });
  }

  private updateDeviceList(res, newdeviceId) {
    const ele = this.filterData.find(x => x.id === newdeviceId);
    ele.deviceExternalDetails = res.data.deviceExternalDetails;
    this.filterData = this.filterData.filter(x => x.id !== newdeviceId);
    this.filterData.push(ele);
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
    console.log(this._config.p2Props);
    if (this.onlyProblems) {
      this.filterData = this.filterData.filter(x => {
       return this.toggleFilter(x);
      });
      this.filterValue = this.filterValue;
      this.dataSource.data = this.matData.filter(x => this.matToggleFilter(x));
      if (this.matTable) {  this.matTable.renderRows(); }
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
      (this.checkPropForFilter('firmwarestatus') &&  x.c8y_Firmware && x.c8y_Firmware.version &&
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
    }).then((res) => {
      //    this.updateDeviceList(res, newdeviceId);
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
    this.unsubscribeRealTime$.next();
    this.unsubscribeRealTime$.complete();
  }
}
