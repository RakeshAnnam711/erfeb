'use strict';

// Local Modules
var server = require('server');
server.extend(module.superModule);

server.append('List', function (req, res, next) {
    var argCustomerUpdate = {
        EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_ADDRESS_UPDATE,
        customer: customer,
        request: request
    };
    var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

    forterCall.execute(argCustomerUpdate);

    next();
});

module.exports = server.exports();
