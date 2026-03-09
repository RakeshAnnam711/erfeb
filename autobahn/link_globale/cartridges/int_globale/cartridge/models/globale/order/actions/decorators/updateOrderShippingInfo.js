/* eslint-disable no-param-reassign */

'use strict';

/**
 * There is no specific field in Global-e request which will indicate that
 * the Shipping Status has been updated on Global-e side and what is the status.
 * The request itself on this endpoint URL is the prove of the Shipping Status updated on Global-e side.
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - set payment export status
 */
function updateOrderShippingInfo(order, payload) {
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        order.custom[globaleHelpers.customAttr.order.geOrderTrackingNumber] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.OrderTrackingNumber', '')));
        order.custom[globaleHelpers.customAttr.order.geOrderTrackingUrl] = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'InternationalDetails.OrderTrackingUrl', '')));

        this.addNote('Shipping Details have been updated');
    } catch (e) {
        return new Status(Status.ERROR, '500', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'updateOrderShippingInfo', {
        value: updateOrderShippingInfo
    });
};
