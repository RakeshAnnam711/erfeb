/* eslint-disable no-param-reassign */

'use strict';

/**
 * Sets delivery store
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setDeliveryStore(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var shipToStoreCode = objectUtils.getValueByPath(payload, 'ShipToStoreCode', null);
        if (shipToStoreCode) {
            order.custom[globaleHelpers.customAttr.order.geDeliveryStoreId] = shipToStoreCode;
            collections.forEach(order.shipments, function (shipment) {
                shipment.shippingAddress.custom[globaleHelpers.customAttr.orderAddress.geDeliveryStoreId] = shipToStoreCode;
            });
            this.addNote('Delivery Store ID \'' + shipToStoreCode + '\' has been stored to the Order\'s shipment.shippingAddress custom attribute');
        }
    } catch (e) {
        return new Status(Status.ERROR, '202', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setDeliveryStore', {
        value: setDeliveryStore
    });
};
