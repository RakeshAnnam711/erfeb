/* eslint-disable no-param-reassign */

'use strict';

/**
 * Sets Customer Comments into Shipment GiftMessage and custom attribute of SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setCustomerComments(order, payload) {
    var Status = require('dw/system/Status');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var valuesUtils = require('*/cartridge/scripts/util/globale/values');

    try {
        var customerComments = decodeURIComponent(valuesUtils.getValueOrEmptyStringIfNull(objectUtils.getValueByPath(payload, 'CustomerComments', '')));
        if (customerComments) {
            collections.forEach(order.shipments, function (shipment) {
                shipment.setGiftMessage(customerComments);
            });
            order.custom[globaleHelpers.customAttr.order.geCustomerComments] = customerComments;
            this.addNote('CustomerComments have been stored to SFCC Order');
        }
    } catch (e) {
        return new Status(Status.ERROR, '216', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setCustomerComments', {
        value: setCustomerComments
    });
};
