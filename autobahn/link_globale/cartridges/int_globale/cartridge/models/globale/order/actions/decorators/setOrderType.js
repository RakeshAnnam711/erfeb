/* eslint-disable no-param-reassign */

'use strict';

/**
 * Set/Update Mixed Orders Main Order ID
 * @param {dw.order.Order} order - SFCC order
 * @param {number} orderType - Order Type
 * @returns {dw.system.Status} - operation status
 */
function setOrderType(order, orderType) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        order.custom[globaleHelpers.customAttr.order.geOrderType] = orderType;
        this.addNote('Global-e ' + globaleHelpers.customAttr.order.geOrderType + ' attribute has been set into SFCC Order');
    } catch (e) {
        return new Status(Status.ERROR, '235', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setOrderType', {
        value: setOrderType
    });
};
