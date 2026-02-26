'use strict';

/**
 * Sets respective Order Export status
 * @param {dw.order.Order} order - SFCC order
 * @returns {dw.system.Status} - set payment export status
 */
function setExportStatus(order) {
    var Status = require('dw/system/Status');
    var Order = require('dw/order/Order');

    order.setExportStatus(Order.EXPORT_STATUS_READY);
    this.addNote('Order Export Status has been updated to EXPORT_STATUS_READY');

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setExportStatus', {
        value: setExportStatus
    });
};
