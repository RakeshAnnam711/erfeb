'use strict';

/**
 * Returns Global-e Product.EstimatedDeliveryDate API
 * @returns {string|null} - Global-e Product.EstimatedDeliveryDate API using "YYYY-MM-DD" format
 */
function getEstimatedDeliveryDate() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getPliEstimatedDeliveryDate, this.productLineItem);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getEstimatedDeliveryDate', {
        value: getEstimatedDeliveryDate
    });
};
