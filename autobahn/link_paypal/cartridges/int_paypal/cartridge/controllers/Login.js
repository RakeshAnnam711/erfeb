'use strict';

/**
 * @namespace Login
 */

const server = require('server');

server.extend(module.superModule);

server.append('Show', function(req, res, next) {
    const sdk = require('*/cartridge/config/sdk');
    const prefs = require('*/cartridge/config/preferences');

    const viewData = res.getViewData();

    viewData.paypal = {
        sdkUrl: sdk.cartSdkUrl,
        isPayPalEnabled: prefs.isPayPalPmActive
    };

    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
