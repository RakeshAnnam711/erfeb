'use strict';
var base = module.superModule;

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {string} storeType - selected store type value
 * @param {Object} geolocation - geoloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, storeTypeValue, geolocation, showMap, url) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var countryCode = geolocation.countryCode;
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;
    var storeTypeFilter = "";
    if (storeTypeValue.length > 0 && storeTypeValue !== 'all') {
        storeTypeFilter = "custom.storeType='" + storeTypeValue + "'";
    }

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};

    if (postalCode && postalCode !== '') {
        // find by postal code
        searchKey = postalCode;

        storeMgrResult = StoreMgr.searchStoresByPostalCode(
            countryCode,
            searchKey,
            distanceUnit,
            resolvedRadius,
            storeTypeFilter
        );

        searchKey = {
            postalCode: searchKey
        };
    } else {
        // find by coordinates (detect location)
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;

        storeMgrResult = StoreMgr.searchStoresByCoordinates(
            location.lat,
            location.long,
            distanceUnit,
            resolvedRadius,
            storeTypeFilter
        );

        searchKey = {
            lat: location.lat,
            long: location.long
        };
    }

    var actionUrl = url || URLUtils.url('Stores-FindStores', 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('googleApiKey');

    return new StoresModel(storeMgrResult.keySet(), searchKey, resolvedRadius, storeTypeFilter, actionUrl, apiKey, showMap);
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @param {Object} params - Additional parameters to add to the context, should not contain stores
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo, params) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    Object.keys(params).forEach(function (key) {
        if(!context.containsKey(key)) {
            context.put(key, params[key]);
        }
    })

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

/**
 * Creates an array of objects containing the coordinates of the store's returned by the search
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of coordinates objects with store info
 */
function createGeoLocationObject(storesObject) {
    var StoreModel = require('*/cartridge/models/store');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var context;
    var template = 'storeLocator/storeInfoWindow';
    var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');

    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        var storeModel = new StoreModel(store);
        context = {
            store: storeModel
        };

        return {
            name: store.name,
            storeType: store.storeType.value,
            latitude: store.latitude,
            longitude: store.longitude,
            backgroundImage: store.storeType.mapMarker ? store.storeType.mapMarker.backgroundImage : SiteConstants.defaultMapMarker.backgroundImage,
            color: store.storeType.mapMarker ? store.storeType.mapMarker.color : SiteConstants.defaultMapMarker.color,
            infoWindowHtml: renderTemplateHelper.getRenderedHtml(context, template)
        };
    });
}

/**
 * If there is an api key creates the url to include the google maps api else returns null
 * @param {string} apiKey - the api key or null
 * @returns {string|Null} return the api
 */
function getGoogleMapsApi(apiKey) {
    var googleMapsApi;
    if (apiKey) {
        googleMapsApi = require('*/cartridge/config/googleapis').mapsFn(apiKey);
    } else {
        googleMapsApi = null;
    }

    return googleMapsApi;
}

/**
 * If there is an api key and store address get the url to for the embedded map
 * @param {string} apiKey - the api key or null
 * @param {string} storeAddress - full store address
 * @returns {string|Null} return url or null
 */
 function getEmbeddedGoogleMapURL(apiKey, storeAddress) {
    if (apiKey && storeAddress) {
        var encodedAddress = encodeURIComponent(storeAddress);
        return 'https://www.google.com/maps/embed/v1/place?key='+apiKey+'&q='+encodedAddress;
    } else {
        return null;
    }
}

function createStoreTypesObject() {
    var URLUtils = require('dw/web/URLUtils');
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var ObjectTypeDefinition = require('dw/object/ObjectTypeDefinition');
    var objectMgr = SystemObjectMgr.describe('Store');
    var storeObject = ObjectTypeDefinition(objectMgr);
    var storeTypeAttr = storeObject.getCustomAttributeDefinition('storeType');
    var storeTypeValues = storeTypeAttr.values;
    var storeTypePreferencesJSON = preferenceHelper.getAttributeValue('storeTypePreferences');
    var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');

    try {
        storeTypePreferencesJSON = JSON.parse(storeTypePreferencesJSON)
    } catch (e) {
        storeTypePreferencesJSON = [];
        dw.system.Logger.error('storeTypePreferences custom preference json is invalid: ' + e);
    }

    var storeTypeArray = [];
    for (var i = 0; i < storeTypeValues.length; i++) {
        var backgroundImage = SiteConstants.defaultMapMarker.backgroundImage;
        var color = SiteConstants.defaultMapMarker.color;
        if (storeTypePreferencesJSON) {
            for (var j = 0; j < storeTypePreferencesJSON.length; j++) {
                if (storeTypePreferencesJSON[j] && storeTypePreferencesJSON[j].value === storeTypeValues[i].value) {
                    if (storeTypePreferencesJSON[j].mapMarker && storeTypePreferencesJSON[j].mapMarker.backgroundImage) {
                        backgroundImage = storeTypePreferencesJSON[j].mapMarker.backgroundImage;
                    }
                    if (storeTypePreferencesJSON[j].mapMarker && storeTypePreferencesJSON[j].mapMarker.color) {
                        color = storeTypePreferencesJSON[j].mapMarker.color;
                    }
                } else if (storeTypePreferencesJSON.default && storeTypePreferencesJSON.default.mapMarker) {
                    if (storeTypePreferencesJSON.default.mapMarker.backgroundImage) {
                        backgroundImage = storeTypePreferencesJSON.default.mapMarker.backgroundImage;
                    }
                    if (storeTypePreferencesJSON.default.mapMarker.color) {
                        color = storeTypePreferencesJSON.default.mapMarker.color;
                    }
                }
            }
        }

        if (storeTypeValues[i].value) {
            storeTypeArray.push({
                id: i,
                value: storeTypeValues[i].value,
                displayValue: storeTypeValues[i].displayValue,
                mapMarker: {
                    backgroundImage: URLUtils.staticURL(backgroundImage).toString(),
                    color: color
                }
            });
        }
    }
    return storeTypeArray;
}

/**
 * Creates an array of objects containing store information
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of objects that contains store information
 */
function createStoresObject(storesObject, storeTypes) {
    var StoreModel = require('*/cartridge/models/store');
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        var storeType = {};
        if (storeTypes && storeTypes.length) {
            for (var i = 0; i < storeTypes.length; i++) {
                if (storeTypes[i].value === store.custom.storeType.value) {
                    storeType = storeTypes[i];
                    break;
                }
            }
        }
        return new StoreModel(store, storeType);
    });
}

function setPreferredStore(session, customer, preferredStoreID) {
    var Logger = require('dw/system/Logger');
    try {
        var BasketMgr = require('dw/order/BasketMgr');
        var basket = BasketMgr.getCurrentBasket();
        if (preferredStoreID) {
            if (customer && customer.profile) {
                dw.system.Transaction.wrap(function() {
                    customer.profile.custom.preferredStoreID = preferredStoreID;
                })
            } else {
                dw.system.Transaction.wrap(function() {
                    session.custom.preferredStoreID = preferredStoreID;
                })
            }
            dw.system.Transaction.wrap(function () {
              if (basket) {
                basket.custom.preferredStoreID = preferredStoreID;
              }
            })
            return true;
        }

        return false;
    } catch (e) {
        Logger.error('setPreferredStore transaction failure: {0} [line {1} in {2}]', e.message, e.lineNumber, e.fileName);

        return false;
    }
}

function setPreferredStoreViewData(req, res) {
    if (req.session && req.session.raw && req.session.raw.custom.preferredStoreID) {
        res.setViewData({preferredStoreID: req.session.raw.custom.preferredStoreID});
    } else if (req.currentCustomer.raw && req.currentCustomer.raw.profile && req.currentCustomer.raw.profile.custom.preferredStoreID) {
        res.setViewData({preferredStoreID: req.currentCustomer.raw.profile.custom.preferredStoreID});
    }
}

base.getStores = getStores;
base.createStoresResultsHtml = createStoresResultsHtml;
base.createGeoLocationObject = createGeoLocationObject;
base.getGoogleMapsApi = getGoogleMapsApi;
base.getEmbeddedGoogleMapURL = getEmbeddedGoogleMapURL;
base.createStoreTypesObject = createStoreTypesObject;
base.createStoresObject = createStoresObject;
base.setPreferredStore = setPreferredStore;
base.setPreferredStoreViewData = setPreferredStoreViewData;

module.exports = base;
