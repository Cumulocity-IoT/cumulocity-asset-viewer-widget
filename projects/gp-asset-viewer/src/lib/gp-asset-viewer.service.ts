import { Injectable } from '@angular/core';
import { InventoryBinaryService, InventoryService, IResultList , IResult, IManagedObject, IManagedObjectBinary} from '@c8y/client';

@Injectable()
export class GpAssetViewerService {

  devicesAll: any;
  constructor(private inventoryService: InventoryService, private inventoryBinaryService: InventoryBinaryService) { }

  async getDeviceList(DeviceGroup: any, pageSize: any, currentPage: any, onlyChildDevice: boolean) {

    let response: any = null;
    const filter: object = {
      pageSize,
      withTotalPages: true,
      currentPage
    };
    if (onlyChildDevice) {
      response = (await this.inventoryService.childDevicesList(DeviceGroup, filter));
    } else {
      response = (await this.inventoryService.childAssetsList(DeviceGroup, filter));
    }
  // Check that the response is a Group and not a device
    if (response.hasOwnProperty('c8y_IsDevice')) {
      alert('Please select a group for this widget to fuction correctly');
    }
    return response;
  }

  getAllDevices(pageToGet: number, allDevices: { data: any[], res: any }): Promise<IResultList<IManagedObject>> {
    const inventoryFilter = {
      fragmentType: 'c8y_IsDevice',
      pageSize: 2000,
      withTotalPages: true,
      currentPage: pageToGet
    };
    if (!allDevices) {
      allDevices = { data: [], res: null };
    }

    return new Promise(
      (resolve, reject) => {
        this.inventoryService.list(inventoryFilter)
          .then((resp) => {
            if (resp.res.status === 200) {
              if (resp.data && resp.data.length >= 0) {
                allDevices.data.push.apply(allDevices.data, resp.data);
                if (resp.data.length < inventoryFilter.pageSize) {
                  resolve(allDevices);
                } else {
                  this.getAllDevices(resp.paging.nextPage, allDevices)
                    .then((np) => {
                      resolve(allDevices);
                    })
                    .catch((err) => reject(err));
                }
              }
            } else {
              reject(resp);
            }
          });
      });

  }

  public createBinary(file): Promise<IResult<IManagedObjectBinary>> {
    return this.inventoryBinaryService.create(file, {
      deviceListImage: 'DefaultImage', file: { name: file.name }
    });
  }

  public downloadBinary(id): any {
    return this.inventoryBinaryService.download(id);
  }

  getAppId() {
    const currentURL = window.location.href;
    const routeParam = currentURL.split('#');
    if (routeParam.length > 1) {
      const appParamArray = routeParam[1].split('/');
      const appIndex = appParamArray.indexOf('application');
      if (appIndex !== -1) {
        return appParamArray[appIndex + 1];
      }
    }
    return '';
  }
}
