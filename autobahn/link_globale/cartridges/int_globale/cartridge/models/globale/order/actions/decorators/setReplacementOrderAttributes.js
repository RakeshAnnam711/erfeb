/* eslint-disable no-param-reassign */

'use strict';

/**
 * Sets replacement order attributes
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setReplacementOrderAttributes(order, payload) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var isReplacementOrder = objectUtils.getValueByPath(payload, 'IsReplacementOrder', false);
        var originalOrderId = objectUtils.getValueByPath(payload, 'OriginalOrder.MerchantOrderId', null);
        var originalOrderNumber = objectUtils.getValueByPath(payload, 'OriginalOrder.OrderId', null);

        order.custom[globaleHelpers.customAttr.order.geIsReplacementOrder] = isReplacementOrder;
        order.custom[globaleHelpers.customAttr.order.geOriginalMerchantOrderNumber] = originalOrderId;
        order.custom[globaleHelpers.customAttr.order.geOriginalOrderNumber] = originalOrderNumber;
        order.custom[globaleHelpers.customAttr.order.geOriginalMerchantInternalOrderNumber] = objectUtils.getValueByPath(payload, 'OriginalOrder.MerchantInternalOrderId', null);

        // order replacement note
        if (isReplacementOrder) {
            this.writeNotes(order, 'GLOBALE_ORDER_REPLACEMENT', ['Replacement for original order ' + originalOrderId + ' / ' + originalOrderNumber]);
        }
    } catch (e) {
        return new Status(Status.ERROR, '202', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setReplacementOrderAttributes', {
        value: setReplacementOrderAttributes
    });
};
