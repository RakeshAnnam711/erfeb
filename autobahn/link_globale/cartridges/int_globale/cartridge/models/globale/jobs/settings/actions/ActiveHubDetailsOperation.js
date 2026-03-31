'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents ActiveHubDetailsOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function ActiveHubDetailsOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
ActiveHubDetailsOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends ActiveHubDetails request (SFCC->GE)
 * @throws {Error}
 */
ActiveHubDetailsOperation.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var service;
    var geActiveHubDetails;

    try {
        // Fetch Global-e ActiveHubDetails
        service = geServiceMgr.getActiveHubDetailsService();
        var serviceResponse = this.getServiceResponse(service.call());

        if (
            (('Code' in serviceResponse) && serviceResponse.Code) ||
            (('Error' in serviceResponse) && serviceResponse.Error)
        ) {
            throw Error('Impossible to fetch ActiveHubDetails: ' + JSON.stringify(serviceResponse));
        }

        // Save Global-e ActiveHubDetails
        Transaction.wrap(function () {
            geActiveHubDetails = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coHubDetails, globaleHelpers.consts.hubKey);
            if (!geActiveHubDetails) {
                geActiveHubDetails = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coHubDetails, globaleHelpers.consts.hubKey);
            }
            geActiveHubDetails.custom.hubID = serviceResponse.HubId;
            geActiveHubDetails.custom.hubName = serviceResponse.HubName;
            geActiveHubDetails.custom.stateOrProvice = serviceResponse.StateOrProvice;
            geActiveHubDetails.custom.city = serviceResponse.City;
            geActiveHubDetails.custom.zip = serviceResponse.Zip;
            geActiveHubDetails.custom.address1 = serviceResponse.Address1;
            geActiveHubDetails.custom.address2 = serviceResponse.Address2;
            geActiveHubDetails.custom.phone1 = serviceResponse.Phone1;
            geActiveHubDetails.custom.phone2 = serviceResponse.Phone2;
            geActiveHubDetails.custom.fax = serviceResponse.Fax;
            geActiveHubDetails.custom.email = serviceResponse.Email;
            geActiveHubDetails.custom.countryCode = serviceResponse.CountryCode;
            geActiveHubDetails.custom.countryName = serviceResponse.CountryName;
            geActiveHubDetails.custom.stateCode = serviceResponse.StateCode;
        });

        // Clean up redundant custom objects and caches
        require('*/cartridge/scripts/helpers/cacheHelpers')
            .invalidateCache(globaleHelpers.cacheKeys.hubDetails, require('dw/system/Site').current.ID + '_' + geActiveHubDetails.custom.key);
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = ActiveHubDetailsOperation;
