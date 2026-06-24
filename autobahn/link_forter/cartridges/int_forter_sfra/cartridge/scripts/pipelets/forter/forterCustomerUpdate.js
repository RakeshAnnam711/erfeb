'use strict';

function execute(args) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterCustomerAccount = require('*/cartridge/scripts/lib/forter/dto/forterCustomerAccount');
    var ForterCustomersService = require('*/cartridge/scripts/lib/forter/services/forterCustomersService');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterCustomerUpdate.js');
    var forterCustomersService = new ForterCustomersService();
    var eventType = args.EventType;

    try {
        var callArgs = {
            siteId: sitePrefs.forterSiteID,
            secretKey: sitePrefs.forterSecretKey,
            customerId: args.customer.ID
        };

        var forterCustomerAccount = new ForterCustomerAccount(eventType, args.request, args.customer);

        log.debug('Forter Customer Account Update Request ::: \n' + JSON.stringify(forterCustomerAccount, undefined, 2));

        var forterResponse = forterCustomersService.send(callArgs, forterCustomerAccount);

        if (forterResponse.ok === true) {
            log.debug('Forter Customer Account Update Response ::: \n' + forterResponse.object.text);
        } else {
            log.error(forterResponse.msg);
        }
    } catch (e) {
        log.error(e);

        return false;
    }

    return true;
}

module.exports = {
    execute: execute
};
