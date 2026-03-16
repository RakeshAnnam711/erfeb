/* eslint-disable no-param-reassign */

'use strict';

/**
 * Updates Order refund info with data received from Global-e
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - set payment export status
 */
function updateOrderRefundInfo(order, payload) { // eslint-disable-line no-unused-vars
    var Status = require('dw/system/Status');

    try {
        /**
         * Override the script and put your custom code here
         * order - SFCC Order
         * payload - Global-e Payload
         */

        this.addNote('Global-e Refunds have been updated to SFCC Order');
    } catch (e) {
        return new Status(Status.ERROR, '600', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'updateOrderRefundInfo', {
        value: updateOrderRefundInfo
    });
};
