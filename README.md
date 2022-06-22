
  # Cumulocity Asset Viewer Widget[<img width="35" src="https://user-images.githubusercontent.com/67993842/97668428-f360cc80-1aa7-11eb-8801-da578bda4334.png"/>](https://github.com/SoftwareAG/cumulocity-asset-viewer-widget/releases/download/2.0.1/asset-viewer-runtime-widget-2.0.1.zip)
  
The Cumulocity Asset Viewer Widget help you to display assets/devices data in Tile/Grid view, along with navigation to template dashboards(App Builder only). This widget also supports various features such as display child devices/assets, configuration of fields/columns, search, display only assets/devices where attentions required, server side pagination, etc.

### Please choose Cumulocity Asset Viewer Widget release based on Cumulocity/Application builder version:

|APPLICATION BUILDER | CUMULOCITY | Cumulocity Asset Viewer Widget |
|--------------------|------------|-----------------------|
| 1.3.x              | >= 1011.x.x| 2.x.x                 |
| 1.2.x              | 1010.x.x   | 1.x.x                 |  

![Asset-Viewer](https://user-images.githubusercontent.com/99970126/169486721-aae8ec50-4eb5-4ae6-ae99-b2da57240e2e.jpg)


## Features

  
*  **Display Assets/Devices:** Displays Assets/Devices for give group in Tile/Grid mode. It also supports child devices/assets.

*  **Pagination:** Configurable Paginations and also option to set default page size.

*  **Configurable Columns:** User can choose what to display in each page of tiles from available list and also option to display custom field.

*  **Dashboard Settings (App Builder only):** Ability to navigate to dashboard by providing dashboard Id.

*  **Custom Images:**  Select and upload custom image to display in all tiles.  

*  **Attentions only:** Unique feature to display only assets/devices which are in high risk or have critical/major alerts. 

  

## Installation

  
### Runtime Widget Deployment?

* This widget support runtime deployment. Download [Runtime Binary](https://github.com/SoftwareAG/cumulocity-asset-viewer-widget/releases/download/2.0.1/asset-viewer-runtime-widget-2.0.1.zip)  and follow runtime deployment instructions.
  

### Installation of widget through App Builder
  

**Supported Cumulocity Environments:**
  

*  **App Builder:** Tested with Cumulocity App Builder version 1.3.0.  
  
**Requirements:**

* Git

* NodeJS (release builds are currently built with `v14.18.0`)

* NPM (Included with NodeJS)

**External dependencies:**

```

"@angular/material": "^11.1.2"

"@ng-select/ng-select": "^6.1.0"

```

**Installation Steps For App Builder:**


**Note:** If you are new to App Builder or not yet downloaded/clone app builder code then please follow [App builder documentation(Build Instructions)](https://github.com/SoftwareAG/cumulocity-app-builder) before proceeding further.



1. Open Your existing App Builder project and install external dependencies by executing below command or install it manually.

    ```

    npm i @angular/material@11.1.2 @ng-select/ng-select@6.1.0

    ```
2. Grab the Asset Viewer widget **[Latest Release Binary](https://github.com/SoftwareAG/cumulocity-asset-viewer-widget/releases/download/2.0.1/gp-asset-viewer-2.0.1.tgz)**.


3. Install the Binary file in app builder.

    ```
    
    npm i <binary file path>/gp-asset-viewer-x.x.x.tgz

    ```

4. Import GpAssetViewerModule in custom-widget.module.ts file located at /cumulocity-app-builder/custom-widgets/

    ```  

    import {GpAssetViewerModule} from  'gp-asset-viewer';

    @NgModule({

    imports: [

    GpAssetViewerModule

    ]

    })

    ```

9. Congratulation! Installation is now completed. Now you can run app builder locally or build and deploy it into your tenant.

    ```

    //Start App Builder

    
    npm run start

    // Build App


    npm run build


    // Deploy App


    npm run deploy


    ```

## Build Instructions

**Note:** It is only necessary to follow these instructions if you are modifying/extending this widget, otherwise see the [Installation Guide](#Installation).

**Requirements:**
  
* Git  

* NodeJS (release builds are currently built with `v14.18.0`)
  

* NPM (Included with NodeJS)
  

**Instructions**


1. Clone the repository:

    ```  

    git clone https://github.com/SoftwareAG/cumulocity-asset-viewer-widget.git

    ```

2. Change directory:

    ```

    cd cumulocity-asset-viewer-widget

    ```

3. (Optional) Checkout a specific version:

    ```

    git checkout <your version>
    
    ```  

4. Install the dependencies:

    ```

    npm install

    ```

5. (Optional) Local development server:

    ```

    ng serve

    ```

6. Build the app:

    ```

    npm run buildPatch

    ```

7. Deploy the app: Follow the [Installation instructions](#Installation)

## QuickStart
  

This guide will teach you how to add widget in your existing or new dashboard.

  

**NOTE:** This guide assumes you have followed the [Installation instructions](#Installation)

  

1. Open you application from App Switcher
  

2. Add new dashboard or navigate to existing dashboard
  

3. Click `Add Widget`
  

4. Search for `Asset Viewer`


5. Select `Target Assets or Devices`


6. Click `Save`


Congratulations! Asset Viewer widget is configured.

  

## User Guide

 

*  **Target assets or devices:** User can select a device/asset or device/asset group. If group is selected, list of devices/assets will be display. If single device/asset selected and enable "Only Child Devices" options then all child devices/assets will be displayed. 
*  **Front Page Settings:** User can select up to 3 fields to display in front page of tile. If user selected "Other" as one of the field then one custom field can be configured for display.
*  **Page1 Settings:** User can select up to 5 fields to display in Page1  of tile. If user selected "Other" as one of the field then one custom field can be configured for display.
*  **Page2 Settings:** User can select up to 5 fields to display in Page2  of tile. If user selected "Other" as one of the field then one custom field can be configured for display.
*  **Dashboard Settings(Application Builder Only):** This feature is available only in application builder. User can navigate to any other dashboard by providing below details:
    * **Device Type:** Select a device type. Navigation will be applied to all devices/assets of this device/asset type to a specific dashboard.
    * **Dashboard ID:** Dashboard ID of a dashboard where user need to navigate. You can find dashboard id in browser URL.
    * **DeviceId as TabGroup:** Select this option only if you are using Group Template as dashboard in application builder and selected deviceId as tabgroup field during group template configuration.
    * **TabGroup ID(optional):** If your dashboard is based on tabgroup then provide tabgroup id.

* **Realtime:** Activate Realtime by default.
* **Include ExternalId:** Widget will call identity service for each asset/device to get external Id. Select only if needed. Not recommended for large set of devices.
* **Only Child Devices:** Display child devices/assets for selected device/assets.
* **Attentions Only(default):** Display only devices/assets where attentions required or have problems for example, critical/major alerts.
* **Grid View(default):** Display grid view instead of tile view by default.
* **Default Page Size:** Select records per page.
* **Upload Default Image:** Upload default image to display in all assets/devices. Please click on upload file after selecting image.

**Asset Viewer On Screen Options:**

*  **Toggle View Mode**: Switch between tile or grid view.
*  **Attention Required**: Activate this to display devices/assets where attentions is required.
*  **Search**: Smart Search filter. User can search by device/asset name, external id, device id, alert type, etc.
*  **Realtime** : On/Off Realtime option.
*  **Refresh**: Useful for force reload/refresh devices.
*  **Pagination**: Page navigation options.

 
  

------------------------------

This widget is provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.

_____________________

For more information you can Ask a Question in the [TECHcommunity Forums](https://tech.forums.softwareag.com/tag/Cumulocity-IoT).
