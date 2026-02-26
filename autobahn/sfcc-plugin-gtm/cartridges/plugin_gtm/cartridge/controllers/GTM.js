'use strict';

var server = require('server');

var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

server.get('CustomerData', function (req, res, next) {
    var customerData = gtmHelpers.getCustomerData(req);

    res.render('/gtm/gtmCustomerData', {
        customerData: JSON.stringify(customerData)
    });
    next();
});

module.exports = server.exports();
