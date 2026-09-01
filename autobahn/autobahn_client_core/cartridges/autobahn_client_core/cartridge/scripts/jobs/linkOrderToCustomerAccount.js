'use strict';

var Logger = require('dw/system/Logger');

var run = function (args) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var customerEmail = args && args.CustomerEmail ? args.CustomerEmail.trim() : null;
    var orderIds = args && args.OrderIds ? args.OrderIds.trim().split(',') : [];
    if (!customerEmail) {
        Logger.error('custom.linkOrderToCustomerAccount(): Missing or invalid CustomerEmail: [{0}]', customerEmail);
        return;
    }
    if (!orderIds.length) {
        Logger.error('custom.linkOrderToCustomerAccount(): Missing or invalid OrderIds: [{0}]', args.OrderIds);
        return;
    }
    Logger.info('custom.linkOrderToCustomerAccount(): OrderIds:[{0}] and CustomerEmail: [{1}]', args.OrderIds, customerEmail);
    try {
        accountHelpers.linkOrdersToCustomerAccount(orderIds, customerEmail);
    } catch(err) {
        Logger.error('custom.linkOrderToCustomerAccount(): Invalid CustomerEmail or OrderIds.', err);
    }
};

exports.run = run;
