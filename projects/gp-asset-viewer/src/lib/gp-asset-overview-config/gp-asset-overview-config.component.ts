import { Component, OnInit, Input, ViewEncapsulation, OnChanges, SimpleChanges, OnDestroy, isDevMode } from '@angular/core';
import { InventoryService } from '@c8y/client';
import { isObject} from 'util';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { GpAssetViewerService } from '../gp-asset-viewer.service';

export interface Property {
  id: any;
  label: string;
  value: string;
}

export interface DashboardConfig {
  type?: any;
  templateID?: string;
  tabGroupID?: string;
  tabGroup?: boolean;
}
@Component({
  selector: 'lib-gp-asset-overview-config',
  templateUrl: './gp-asset-overview-config.component.html',
  styleUrls: ['./gp-asset-overview-config.component.css'],
})

export class GpAssetViewerConfigComponent implements OnInit {

  props = new FormControl();
  p1Props;
  p2Props;
  selected2;
  propertiesToDisplay: Property[] = [];
  fpDataSource = new MatTableDataSource<Property>([]);
  p1DataSource = new MatTableDataSource<Property>([]);
  p2DataSource = new MatTableDataSource<Property>([]);
  properties = [{prop: 'Availability'}, {prop: 'ActiveAlarmsStatus'}, {prop: 'FirmwareStatus'}, {prop: 'Other'} ];
  otherProp = false;
  appId = null;
  dashboardList: DashboardConfig[] = [];
  deviceTypes = null;

  isExpandedFP = false;
  isExpandedP1 = false;
  isExpandedP2 = false;
  isExpandedDBS = false;
  @Input() config: any = {};
  displayedColumns: string[] = ['label', 'property'];

  exemptedValues: string[] = [
    'additionParents',
    'assetParents',
    'c8y_DataPoint',
    'childAdditions',
    'childAssets',
    'childDevices',
    'com_cumulocity_model_Agent',
    'deviceParents',
    'self'
  ];
  observableDevice$: any;
  deviceFile = null;
  busy = false;

  pageSizeList: string[] = ['5', '10', '20', '50', '100' ];
  constructor(
    private invSvc: InventoryService,
    private fb: FormBuilder,
    private deviceListService: GpAssetViewerService
  ) {}

  ngOnInit() {
    this.appId = this.deviceListService.getAppId();
    if (!this.config.configDashboard) {
      this.config.configDashboard = false;
    }
    if (!this.config.pageSize) {
      this.config.pageSize = 5;
    }
    if (!this.config.dashboardList && this.appId) {
      const dashboardObj: DashboardConfig = {};
      dashboardObj.type = 'All';
      this.dashboardList.push(dashboardObj);
      this.config.dashboardList = this.dashboardList;
    }
    this.getAllDevices();
    if (!this.config.device) {
        this.config.device = {};
      }
    this.propertiesToDisplay = [
        {id: 'id', label: 'ID', value: 'id'},
        {id: 'name', label: 'Name', value: 'name'},
        {id: 'owner', label: 'Owner', value: 'owner'},
        {id: 'childDeviceAvailable', label: 'Child devices', value: 'childDeviceAvailable'},
        {id: 'c8y_Availability.status', label: 'Availability status', value: 'c8y_Availability.status'},
        {id: 'c8y_Connection.status', label: 'Connection status', value: 'c8y_Connection.status'},
        {id: 'c8y_Firmware.name', label: 'Firmware name', value: 'c8y_Firmware.name'},
        {id: 'c8y_Firmware.version', label: 'Firmware version', value: 'c8y_Firmware.version'},
        {id: 'c8y_Firmware.versionIssues', label: 'Firmware verison issues', value: 'c8y_Firmware.versionIssues'},
        {id: 'c8y_Firmware.versionIssuesName', label: 'Firmware issue name', value: 'c8y_Firmware.versionIssuesName'},
        {id: 'c8y_RequiredAvailability.responseInterval'
        , label: 'Required availability', value: 'c8y_RequiredAvailability.responseInterval'},
        {id: 'creationTime', label: 'Creation time', value: 'creationTime'},
        {id: 'lastUpdated', label: 'Last updated', value: 'lastUpdated'},
        {id: 'deviceExternalDetails.externalId', label: 'External id', value: 'deviceExternalDetails.externalId'},
        {id: 'deviceExternalDetails.externalType', label: 'External type', value: 'deviceExternalDetails.externalType'},
        {id: 'other', label: 'Other', value: 'other'}
      ];
    if (!this.config.fpProps) {
        this.config.fpProps = ['Availability', 'ActiveAlarmsStatus'];
      } else {
        if (this.config.fpProps.indexOf('Other') > -1) {
          this.otherProp = true;
        }
      }
    this.p1Props = this.fb.group({
        p1Props: [null, Validators.required]
      });
    this.p2Props = this.fb.group({
        p2Props: [null, Validators.required]
      });
    let prop1;
    if (!this.config.p1Props) {
        this.config.p1Props = undefined;
      } else {
         prop1 = this.propertiesToDisplay.filter(prop => {
           let ele;
           this.config.p1Props.forEach(element => {
            if (prop.id === element.id) {
              prop.id === 'other' ? (() => {
                prop.label = element.label;
                prop.value = element.value;
               // tslint:disable-next-line:no-unused-expression
               })() : '';
              ele = prop;
            }
          });
           return ele;
        });
      }
    let prop2;
    if (!this.config.p2Props) {
        this.config.p2Props = undefined;
      } else {
        prop2 = this.propertiesToDisplay.filter(prop => {
          let ele = '';
          this.config.p2Props.forEach(element => {
           if (prop.id === element.id) {
            prop.id === 'other' ? (() => {
              prop.label = element.label;
              prop.value = element.value;
             // tslint:disable-next-line:no-unused-expression
             })() : '';
            ele = element;
           }
         });
          return ele;
       });
     }
    if (!this.config.otherProp) {
        this.config.otherProp = {label: '', value: ''};
      }

    this.props.setValue(this.config.fpProps);
    this.p1Props.get('p1Props').setValue(prop1);
    this.p2Props.get('p2Props').setValue(prop2);
    if (prop1) {
        this.p1DataSource.data = JSON.parse(JSON.stringify(this.p1Props.get('p1Props').value));
      }
    if (prop2) {
      this.p2DataSource.data = JSON.parse(JSON.stringify(this.p2Props.get('p2Props').value));
      }

    if (this.config.realtime === undefined ) {
        this.config.realtime = false;
      }
    if (this.config.isRuntimeExternalId === undefined) {
        this.config.isRuntimeExternalId =  false;
    }
    if (this.config.showChildDevices === undefined) {
      this.config.showChildDevices =  false;
    }
  }

  LoadDefaultFile(files) {
    this.deviceFile = files.files[0];
  }
  uploadFile() {
    this.busy = true;
    this.deviceListService.createBinary(this.deviceFile)
      .then((res) => {
        if (res.data) {
          this.config.defaultImageId = res.data.id;
        }
        this.busy = false;
      });
  }

  onFpChange() {
    if (this.props.value.indexOf('Other') > -1) {
      this.otherProp = true;
    } else {
      this.otherProp = false;
    }
    this.config.fpProps = this.props.value;
  }

  onP1Change() {
    this.p1DataSource.data = JSON.parse(JSON.stringify(this.p1Props.get('p1Props').value));
    this.config.p1Props = this.p1Props.get('p1Props').value;
  }

  onP2Change() {
    this.p2DataSource.data = JSON.parse(JSON.stringify(this.p2Props.get('p2Props').value));
    this.config.p2Props = this.p2Props.get('p2Props').value;
  }

  commitToP1PropsConfig(props) {
    this.config.p1Props = props.data;
   }

  commitToP2PropsConfig(props) {
    this.config.p2Props = props.data;
  }

  getDeviceProperties(id: any) {
    // tslint:disable-next-line:variable-name
    const _this = this;
    const filter: object = {
      pageSize: 100,
      withTotalPages: true
    };
    this.invSvc.childAssetsList(id, filter).then(res => {
      res.data.forEach(mo => {
        _this.getObjectsAllProperties(mo, _this.propertiesToDisplay);
      });
    });
  }

  getObjectsAllProperties(object: object, propertyTypes: Property[]): any {
    // tslint:disable-next-line:variable-name
    const _this = this;
    return Object.keys(object).forEach(key => {
      if (_this.exemptedValues.indexOf(key) < 0) {
        if (propertyTypes.findIndex(prop => {
          return prop.value === key;
        }) === -1) {
          if (isObject(object[key])) {
            _this.fetchObjects(object[key], key, propertyTypes);
          } else if (typeof object[key] === 'string') {
            propertyTypes.push({id: key, label: key, value: key});
          } else if (typeof object[key] === 'number') {
            propertyTypes.push({id: key, label: key, value: key});
          }
        }
      }
    });
  }

  fetchObjects(objectSubProperty, key, propertyTypes): void {
    // tslint:disable-next-line:variable-name
    const _this = this;
    Object.keys(objectSubProperty).forEach((childKey) => {
      const propKey = key + '.' + childKey;
      if (propertyTypes.findIndex(prop => {
        return prop.value === propKey;
      }) === -1) {
        if (isObject(objectSubProperty[childKey])) {
          _this.fetchObjects(objectSubProperty[childKey], propKey, propertyTypes);
        } else if (typeof objectSubProperty[childKey] === 'string') {
          propertyTypes.push({id: propKey, label: childKey, value: propKey});
        } else if (typeof objectSubProperty[childKey] === 'number') {
          propertyTypes.push({id: propKey, label: childKey, value: propKey});
        }
      }
    });
  }

  private getAllDevices() {
    const deviceList: any = null;
    this.deviceListService.getAllDevices(1, deviceList)
      .then((deviceFound) => {
        this.deviceTypes = Array.from(new Set(deviceFound.data.map(item => item.type)));
        this.deviceTypes = this.deviceTypes.filter(n => n);
      })
      .catch((err) => {
        if (isDevMode()) { console.log('+-+- ERROR while getting ALL devices ', err); }
      });
  }
  addNewRecord(currentIndex) {
    if ((currentIndex + 1) === this.config.dashboardList.length) {
      const dashboardObj: DashboardConfig = {};
      dashboardObj.type = 'All';
      this.config.dashboardList.push(dashboardObj);
    }
  }
}
