'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Endpoint to get the final redirect location URL
 */
server.get(
    'GetRedirectLocationURL',
    server.middleware.https,
    function (req, res, next) {
        var globaleResponse = require('*/cartridge/models/globale/response');
        var globaleCountryHelpers = require('*/cartridge/scripts/helpers/globaleCountryHelpers');

        globaleResponse.setExpires(new Date(Date.now() + (1 * 60 * 60 * 1000))); // set 1 hour cache of response
        var redirectUrl = globaleCountryHelpers.getRedirectUrl();
        res.json({
            success: true,
            finalUrl: redirectUrl
        });

        next();
    }
);

module.exports = server.exports();
