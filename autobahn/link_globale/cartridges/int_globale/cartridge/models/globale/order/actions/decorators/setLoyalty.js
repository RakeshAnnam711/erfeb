/* eslint-disable no-param-reassign */

'use strict';

/**
 * Stores Loyalty Data to SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setLoyalty(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        order.custom[globaleHelpers.customAttr.order.geLoyaltyPointsSpent] = objectUtils.getValueByPath(payload, 'LoyaltyPointsSpent', null);
        order.custom[globaleHelpers.customAttr.order.geLoyaltyPointsEarned] = objectUtils.getValueByPath(payload, 'LoyaltyPointsEarned', null);
        order.custom[globaleHelpers.customAttr.order.geLoyaltyCode] = objectUtils.getValueByPath(payload, 'LoyaltyCode', null);

        this.addNote('Global-e Loyalty Data have been stored into SFCC Order');
    } catch (e) {
        return new Status(Status.ERROR, '207', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setLoyalty', {
        value: setLoyalty
    });
};
