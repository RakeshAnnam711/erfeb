'use strict';

/**
 * Set Customer Email in SFCC Order
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - operation status
 */
function setCustomerEmail(order, payload) {
    var Encoding = require('dw/crypto/Encoding');
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var geIsEndCustomerPrimary = objectUtils.getValueByPath(payload, 'Customer.IsEndCustomerPrimary', null);
        var orderCustomerEmail = geIsEndCustomerPrimary ?
            Encoding.fromURI(objectUtils.getValueByPath(payload, 'PrimaryShipping.Email', '')) :
            Encoding.fromURI(objectUtils.getValueByPath(payload, 'Customer.EmailAddress', ''));

        order.setCustomerEmail(orderCustomerEmail);

        this.addNote('Order.customerEmail has been updated');
    } catch (e) {
        return new Status(Status.ERROR, '206', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setCustomerEmail', {
        value: setCustomerEmail
    });
};
