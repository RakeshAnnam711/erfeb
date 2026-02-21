'use strict';

/**
 * Set/Update Customer Name in SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setCustomerName(order, payload) {
    var Status = require('dw/system/Status');
    var Encoding = require('dw/crypto/Encoding');

    try {
        var customerName = [];
        if (payload.PrimaryBilling.FirstName) {
            customerName.push(Encoding.fromURI(payload.PrimaryBilling.FirstName));
        }
        if (payload.PrimaryBilling.LastName) {
            customerName.push(Encoding.fromURI(payload.PrimaryBilling.LastName));
        }
        if (customerName.length > 0) {
            order.setCustomerName(customerName.join(' '));
        }
        this.addNote('Order.customerName has been updated');
    } catch (e) {
        return new Status(Status.ERROR, '201', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setCustomerName', {
        value: setCustomerName
    });
};
