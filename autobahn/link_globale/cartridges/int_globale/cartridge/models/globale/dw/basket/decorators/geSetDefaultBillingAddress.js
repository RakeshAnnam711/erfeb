'use strict';

/**
 * Sets basket default billing address
 */
function geSetDefaultBillingAddress() {
    var billingAddress = !this.billingAddress ? this.createBillingAddress() : this.getBillingAddress();
    billingAddress.setFirstName('Global-e');
    billingAddress.setLastName('Global-e');
    billingAddress.setCity('Global-e');
    billingAddress.setCountryCode('IL');
    if (!this.getCustomerName()) {
        this.setCustomerName('Global-e Global-e');
    }
}

module.exports = function (object) {
    Object.defineProperty(object, 'geSetDefaultBillingAddress', {
        value: geSetDefaultBillingAddress
    });
};
