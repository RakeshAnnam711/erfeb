'use strict';
/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject, storeType) {
    if (storeObject) {
        this.ID = storeObject.ID;
        this.name = storeObject.name;
        this.address1 = storeObject.address1;
        this.address2 = storeObject.address2;
        this.city = storeObject.city;
        this.postalCode = storeObject.postalCode;
        this.latitude = storeObject.latitude;
        this.longitude = storeObject.longitude;

        if (storeObject.phone) {
            this.phone = storeObject.phone;
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.countryCode) {
            this.countryCode = storeObject.countryCode.value;
        }

        if (storeObject.stateCode) {
            this.stateCode = storeObject.stateCode;
        }

        if (storeObject.storeHours) {
            this.storeHours = storeObject.storeHours.markup;
        }

        if (storeType) {
            if(Object.keys(storeType).length === 0 && storeType.constructor === Object) {
                var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
                this.storeType = [];
                this.storeType.id = SiteConstants.defaultStoreType.id;
                this.storeType.displayValue = SiteConstants.defaultStoreType.displayValue;
                this.storeType.value = SiteConstants.defaultStoreType.value;
            } else {
                this.storeType = [];
                this.storeType.id = storeType.id;
                this.storeType.displayValue = storeType.displayValue;
                this.storeType.value = storeType.value;

                if (storeType.mapMarker) {
                    this.storeType.mapMarker = [];
                    this.storeType.mapMarker.color = storeType.mapMarker.color;
                    this.storeType.mapMarker.backgroundImage = storeType.mapMarker.backgroundImage;
                }
            }
        }
    }
}

module.exports = store;
