'use strict';

const TYPE_CUSTOMER_BILLING = 'CustomerBilling';
const TYPE_CUSTOMER_SHIPPING = 'CustomerShipping';

/**
 * Creates customer details from order by type.
 *
 * @param {dw.order.LineItemCtnr} order - the order object
 * @param {string} type - the type of address details (allowed values are: CustomerBilling, CustomerShipping)
 * @return {Object|null} the newly created address details or null
 */
function createCustomerDetailsFromOrderByType(order, type) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var CustomerDetails = require('*/cartridge/models/globale/api/CustomerDetails');
    var customerDetails = null;
    var addressPrefix = null;

    switch (type) {
        case TYPE_CUSTOMER_BILLING:
            addressPrefix = globaleHelpers.consts.geAddresses.CUSTOMER_BILLING_PREFIX;
            break;
        case TYPE_CUSTOMER_SHIPPING:
            addressPrefix = globaleHelpers.consts.geAddresses.CUSTOMER_SHIPPING_PREFIX;
            break;
        default:
            break;
    }

    if (order && addressPrefix !== null) {
        customerDetails = new CustomerDetails();
        Object.keys(customerDetails).forEach(function (key) {
            if (globaleHelpers.customAttr.order[addressPrefix + key] in order.custom) {
                customerDetails[key] = order.custom[globaleHelpers.customAttr.order[addressPrefix + key]];
            }
        });
    }

    return customerDetails;
}

module.exports = {
    TYPE_CUSTOMER_BILLING: TYPE_CUSTOMER_BILLING,
    TYPE_CUSTOMER_SHIPPING: TYPE_CUSTOMER_SHIPPING,
    createCustomerDetailsFromOrderByType: createCustomerDetailsFromOrderByType
};
