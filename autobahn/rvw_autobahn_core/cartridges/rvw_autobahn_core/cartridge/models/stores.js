'use strict';

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.util.Set} storesResultsObject - a set of <dw.catalog.Store> objects
 * @param {Object} searchKey - what the user searched by (location or postal code)
 * @param {string} storeType - the store type used in filtering search results
 * @param {number} searchRadius - the radius used in the search
 * @param {dw.web.URL} actionUrl - a relative url
 * @param {string} apiKey - the google maps api key that is set in site preferences
 * @param {boolean} showMap - Indicates whether to show map, also determines what layout is for a store in storeLocatorResults.isml
 */

 /*
function stores(storesResultsObject, searchKey, searchRadius, storesType, actionUrl, apiKey, showMap) {
    this.stores = createStoresObject(storesResultsObject);
    this.locations = JSON.stringify(createGeoLocationObject(storesResultsObject));
    */
function stores(storesResultsObject, searchKey, searchRadius, storeType, actionUrl, apiKey, showMap) {
    var Logger = require('dw/system/Logger').getLogger('AB_StoreFinder');
    var Site = require('dw/system/Site');
    var storeSearchRadiusOptions = Site.getCurrent().getCustomPreferenceValue('storeSearchRadiusOptions');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

    this.storeTypes = storeHelpers.createStoreTypesObject();
    this.stores = storeHelpers.createStoresObject(storesResultsObject, this.storeTypes);
    this.locations = JSON.stringify(storeHelpers.createGeoLocationObject(this.stores));
    this.searchKey = searchKey;
    this.radius = searchRadius;
    this.storeType = storeType;
    this.actionUrl = actionUrl;
    this.googleMapsApi = storeHelpers.getGoogleMapsApi(apiKey);

    var radiusOptions = [];

    if (storeSearchRadiusOptions) {
        Object.keys(storeSearchRadiusOptions).forEach(function (index) {
            var radius = storeSearchRadiusOptions[index];

            if (typeof radius === 'number') {
                radiusOptions.push(radius);
            } else {
                Logger.warn('Site Pref [storeSearchRadiusOptions] invalid radius.');
            }
        });
    } else {
        radiusOptions = [15, 30, 50, 100, 300];
    }

    this.radiusOptions = radiusOptions;

    var params = {
        showMap : showMap
    };
    this.storesResultsHtml = this.stores ? storeHelpers.createStoresResultsHtml(this.stores, params) : null;
}

module.exports = stores;
