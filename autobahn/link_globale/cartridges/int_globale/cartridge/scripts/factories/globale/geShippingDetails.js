'use strict';

/**
 * Returns shipping details
 * @param {string|null} countryCode - country code
 * @param {string} currencyCode - currency code
 * @param {number} amount - amount
 * @param {array} productIds - product IDs
 * @returns {Object|null} - shipping details response
 */
function getDetails(countryCode, currencyCode, amount, productIds) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var ShippingDetailsOperationData = require('*/cartridge/models/globale/shippingDetails/ShippingDetailsOperationData');
    var ShippingDetailsOperationResult = require('*/cartridge/models/globale/shippingDetails/ShippingDetailsOperationResult');

    var operationData = new ShippingDetailsOperationData({
        destinationCountry: countryCode,
        currencyCode: currencyCode,
        amount: amount,
        productCodes: productIds
    });
    var operationResult = new ShippingDetailsOperationResult();

    try {
        // create operation handler
        var ShippingDetailsOperation = require('*/cartridge/models/globale/shippingDetails/ShippingDetailsOperation');
        var operationHandler = new ShippingDetailsOperation(operationData, operationResult);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('GLOBALE_SHIPPING_DETAILS: {0}', logger.message(e));

        operationResult.success = false;
        operationResult.errorCode = operationResult.errorCode || 100; // general error code
        operationResult.errorMessage = operationResult.errorMessage || (e.message + '; ' + e.stack);
    }

    return operationResult;
}

module.exports = {
    getDetails: getDetails
};
