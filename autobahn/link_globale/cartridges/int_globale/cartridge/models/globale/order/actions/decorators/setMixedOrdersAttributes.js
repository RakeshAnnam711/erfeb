/* eslint-disable no-param-reassign */

'use strict';

/**
 * Set/Update Mixed Orders Main Order ID
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setMixedOrdersMainOrderID(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        order.custom[globaleHelpers.customAttr.order.geMixedOrdersMainOrderID] = payload.OrderId;
        this.addNote('Global-e ' + globaleHelpers.customAttr.order.geMixedOrdersMainOrderID + ' attribute has been set into SFCC Order');
    } catch (e) {
        return new Status(Status.ERROR, '234', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Set/Update Mixed Orders Sub Order ID
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setMixedOrdersSubOrderIDs(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var requestHelpers = require('*/cartridge/scripts/helpers/requestHelpers');

    try {
        // check sub orders
        if (requestHelpers.isSubOrdersInPayload(payload)) {
            order.custom[globaleHelpers.customAttr.order.geMixedOrdersSubOrdersIDs] = payload.Subs.map(function (subOrderPayload) { return subOrderPayload.OrderId; }).join(',');
            this.addNote('Global-e ' + globaleHelpers.customAttr.order.geMixedOrdersSubOrdersIDs + ' attribute has been set into SFCC Order');
        }
    } catch (e) {
        return new Status(Status.ERROR, '234', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

/**
 * Set/Update Mixed Orders Successfully Updated Flag
 * @param {dw.order.Order} order - SFCC order
 * @param {boolean} flagValue - flag value
 * @returns {void}
 */
function setMixedOrdersSuccessfullyUpdatedFlag(order, flagValue) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        Transaction.wrap(function () {
            order.custom[globaleHelpers.customAttr.order.geMixedOrdersSuccessfullyUpdated] = !!flagValue;
        });
    } catch (e) {
        // skip handling exception
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        setMixedOrdersMainOrderID: {
            value: setMixedOrdersMainOrderID
        },
        setMixedOrdersSubOrderIDs: {
            value: setMixedOrdersSubOrderIDs
        },
        setMixedOrdersSuccessfullyUpdatedFlag: {
            value: setMixedOrdersSuccessfullyUpdatedFlag
        }
    });
};
