'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

server.replace('Find', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var storeTypeValue = req.querystring.storeType || 'all';
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;

    if (empty(postalCode) && empty(lat) && empty(long)) {
        res.cachePeriod = 0; // Avoid caching for general locations
    }


    var stores = storeHelpers.getStores(radius, postalCode, lat, long, storeTypeValue, req.geolocation, showMap);

    var viewData = {
        stores: stores,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap,
        storeTypes: stores.storeTypes
    };

    res.render('storeLocator/storeLocator', viewData);
    next();
});

// The req parameter in the unnamed callback function is a local instance of the request object.
// The req parameter has a property called querystring. In this use case the querystring could
// have the following:
// lat - The latitude of the users position.
// long - The longitude of the users position.
// radius - The radius that the user selected to refine the search
// storeTypeValue - The store type that the user selected to refine the search
// or
// postalCode - The postal code that the user used to search.
// radius - The radius that the user selected to refine the search
server.replace('FindStores', function (req, res, next) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var storeTypeValue = req.querystring.storeType || 'all';

    var stores = storeHelpers.getStores(radius, postalCode, lat, long, storeTypeValue, req.geolocation, showMap);

    res.json(stores);
    next();
});

// Render a detail page for a given store
server.get('Detail', cache.applyDefaultCache, consentTracking.consent, function(req, res, next) {
    var Site = require('dw/system/Site');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
    var store = StoreMgr.getStore(req.querystring.storeID);

    if (!store) {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        var storeTypes = storeHelpers.createStoreTypesObject();
        var storeObject = storeHelpers.createStoresObject([store], storeTypes);
        var apiKey = Site.getCurrent().getCustomPreferenceValue('googleApiKey');
        var storeImage;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('title.hero.text', 'storeLocator', null),
                url: URLUtils.url('Stores-Find','showMap','true','horizontalView','true','isForm','true').toString()
            },
            {
                htmlValue: store.name
            }
        ];

        if (!empty(store.image)) {
            var imageParams = {
                scaleWidth: ContentImageBreakpoints.tablet,
                scaleMode: 'fit',
                format: 'jpg'
            }
            storeImage = {
                src: store.image.getImageURL(imageParams),
                alt: store.image.alt ? store.image.alt : store.name
            }
        }

        var storeAddress = (store.address1 ? store.address1 : '') + (store.address2 ? ' ' + store.address2 : '') + (store.city ? ', ' + store.city : '') + (store.stateCode ? ', ' + store.stateCode : '') + (store.postalCode ? ' ' + store.postalCode : '');

        res.render('storeLocator/storeDetailPage', {
            breadcrumbs: breadcrumbs,
            store: store,
            storeAddress: storeAddress,
            storeImage: storeImage,
            embeddedGoogleMapURL: storeHelpers.getEmbeddedGoogleMapURL(apiKey, storeAddress),
            locations: JSON.stringify(storeHelpers.createGeoLocationObject(storeObject))
        });
    }

    next();
}, pageMetaData.computedPageMetaData);

server.get('FindStoresInHeader', function(req, res, next) {
    if (res.viewData.abConfigs.storeHeaderSelectorEnabled) {
        var StoresModel = require('*/cartridge/models/stores');
        var storeSearchResult;

        if (req.querystring.mystore) {
            storeSearchResult = dw.catalog.StoreMgr.getStore(req.querystring.mystore);
        }

        if (!storeSearchResult) {
            if (req.currentCustomer.raw && req.currentCustomer.raw.profile && req.currentCustomer.raw.profile.custom.preferredStoreID) {
                storeSearchResult = dw.catalog.StoreMgr.getStore(req.currentCustomer.raw.profile.custom.preferredStoreID);
            } else if (req.session.raw.custom.preferredStoreID) {
                storeSearchResult = dw.catalog.StoreMgr.getStore(req.session.raw.custom.preferredStoreID);
            }
        }

        var preferredStoreName = '';
        if (storeSearchResult) {
            preferredStoreName = storeSearchResult.name;
            storeSearchResult = {
                1: storeSearchResult
            }
            var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
            storeHelpers.setPreferredStore(req.session.raw, req.currentCustomer.raw, storeSearchResult[1].ID);
            preferredStoreName = storeSearchResult[1].name;
        } else {
            var distanceUnit = req.geolocation.countryCode === 'US' ? 'mi' : 'km';
            storeSearchResult = dw.catalog.StoreMgr.searchStoresByCoordinates(req.geolocation.latitude, req.geolocation.longitude, distanceUnit, dw.system.Site.current.getCustomPreferenceValue('storeHeaderSelectorAutoLocationRadius'));
            if (storeSearchResult && storeSearchResult.length) {
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                storeHelpers.setPreferredStore(req.session.raw, req.currentCustomer.raw, storeSearchResult.keySet()[0].ID);
                preferredStoreName = storeSearchResult.keySet()[0].name;
            }
        }

        var stores = new StoresModel(storeSearchResult || {}, '', '', 'all', dw.web.URLUtils.url('Stores-FindStores', 'showMap', false).toString(), '', false);

        var viewData = {
            stores: stores,
            horizontalView: 'true',
            isForm: 'true',
            showMap: 'false',
            storeTypes: stores.storeTypes,
            showSelectStore: 'true',
            showLocationBtn: 'true',
            setPreferredStoreActionUrl: dw.web.URLUtils.url('Stores-SetPreferredStore').toString(),
            preferredStoreName: preferredStoreName
        };

        res.render('storeLocator/storeLocatorHeaderButton', viewData);
    } else {
        res.render('common/layout/empty', {});
    }

    next();
});

server.get('SetPreferredStore', function(req, res, next) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    if (storeHelpers.setPreferredStore(req.session.raw, req.currentCustomer.raw, req.httpParameterMap.preferredStoreID.value)) {
        res.json({
            success: true
        });
    } else {
        res.json({
            success: false
        })
    }

    next();
});

module.exports = server.exports();
