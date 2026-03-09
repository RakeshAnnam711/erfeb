// CheckoutShippingServices.js

'use strict';

var server = require('server');
var shippingservice = module.superModule;
server.extend(shippingservice);

// Extend UpdateShippingMethodsList route to include Estimated Delivery Dates in viewData
server.append('SelectShippingMethod', function shippingMethodSelection(req, res, next) {
    var Site = require('dw/system/Site');

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
        var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper'); // eslint-disable-line vars-on-top, max-len
        this.on('route:BeforeComplete', function getShipmentsData(req, res) { // eslint-disable-line no-shadow, max-len
            var thisViewData = res.getViewData(); // eslint-disable-line vars-on-top
            res.setViewData(zenkraftHelper.handleShippingMethods(thisViewData));
        });
    }
    return next();
});

// Extend UpdateShippingMethodsList route to include Estimated Delivery Dates in viewData
server.append('UpdateShippingMethodsList', function shippingMethodSelection(req, res, next) {
    var Site = require('dw/system/Site');

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
        var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper'); // eslint-disable-line vars-on-top, max-len
        var thisViewData = res.getViewData(); // eslint-disable-line vars-on-top
        res.setViewData(zenkraftHelper.handleShippingMethods(thisViewData));
    }
    next();
});

// Extend UpdateShippingMethodsList route to include Estimated Delivery Dates in viewData
server.append('SubmitShipping', function shippingMethodSelection(req, res, next) {
    var Site = require('dw/system/Site');
    var httpParameterMap = request.getHttpParameterMap();
    if (httpParameterMap.drop_off_location_data.isSubmitted()) {
        session.getPrivacy().drop_off_location_data = httpParameterMap.drop_off_location_data.value;
    }
    if (httpParameterMap.requested_delivery_date.isSubmitted()) {
        session.getPrivacy().requested_delivery_date = httpParameterMap.requested_delivery_date.value;
    }
    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
        var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper'); // eslint-disable-line vars-on-top, max-len

        this.on('route:BeforeComplete', function shippingMethodSelection(req, res) {
            var thisViewData = res.getViewData(); // eslint-disable-line vars-on-top
            res.setViewData(zenkraftHelper.handleShippingMethods(thisViewData));
        });
    }
    return next();
});

module.exports = server.exports();
