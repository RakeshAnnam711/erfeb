'use strict';

/**
 * Performs inventory reservation
 * @param {dw.order.Basket} basket - SFCC basket
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function reserveInventory(basket, payload) { // eslint-disable-line no-unused-vars
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var Status = require('dw/system/Status');

    try {
        var enableStockReservation = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geEnableStockReservation);
        if (enableStockReservation && !basket.getInventoryReservationExpiry() && basket.reserveInventory(1).isError()) {
            throw new Error('Reserve Inventory is failed');
        }
    } catch (e) {
        return new Status(Status.ERROR, '202', e.message);
    }
    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        reserveInventory: {
            value: reserveInventory
        }
    });
};
