'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

server.extend(module.superModule);

// The req parameter in the unnamed callback function is a local instance of the request object.
// The req parameter has a property called querystring. In this use case the querystring could
// have the following:
// lat - The latitude of the users position.
// long - The longitude of the users position.
// radius - The radius that the user selected to refine the search
// or
// postalCode - The postal code that the user used to search.
// radius - The radius that the user selected to refine the search
server.replace('FindStores', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;
    var storeTypeValue = req.querystring.storeType || 'all';
    var products;

    var url = null;
    if (req.querystring.products) {
        products = storeHelpers.buildProductListAsJson(req.querystring.products);
    }

    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, storeTypeValue, req.geolocation, showMap, url, products);

    var context = {
        stores: storesModel,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap
    };

    var storesResultsHtml = storesModel.stores
        ? renderTemplateHelper.getRenderedHtml(context, 'storeLocator/storeLocatorResults')
        : null;
    storesModel.storesResultsHtml = storesResultsHtml;

    if (products) {
        var noInventoryStoresHtml = storesModel.noInventoryStores
            ? renderTemplateHelper.getRenderedHtml(context, 'storeLocator/storeLocatorNoInventoryResults')
            : null;
        storesModel.noInventoryStoresHtml = noInventoryStoresHtml;
    }

    res.json(storesModel);
    next();
});

module.exports = server.exports();
