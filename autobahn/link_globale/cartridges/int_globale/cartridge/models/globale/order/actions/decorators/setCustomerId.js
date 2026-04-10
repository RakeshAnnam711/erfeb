'use strict';

/**
 * Set/Update Customer Name in SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setCustomerId(order, payload) {
    var Status = require('dw/system/Status');
    var CustomerMgr = require('dw/customer/CustomerMgr');

    try {
        if (payload.UserId) {
            var customer = CustomerMgr.getCustomerByCustomerNumber(payload.UserId);
            if (customer !== null) {
                order.setCustomer(customer);
                this.addNote('Order customer has been updated');
            }
        }
    } catch (e) {
        return new Status(Status.ERROR, '201', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setCustomerId', {
        value: setCustomerId
    });
};
