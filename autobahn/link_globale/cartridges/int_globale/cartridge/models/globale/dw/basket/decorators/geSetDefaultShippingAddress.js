'use strict';

/**
 * Sets basket default shipping address
 */
function geSetDefaultShippingAddress() {
    var defaultShipment = this.defaultShipment;
    var shippingAddress = defaultShipment.shippingAddress ? defaultShipment.shippingAddress : defaultShipment.createShippingAddress();
    shippingAddress.setFirstName('Global-e');
    shippingAddress.setLastName('Global-e');
    shippingAddress.setCity('Global-e');
    shippingAddress.setCountryCode('IL');
}

module.exports = function (object) {
    Object.defineProperty(object, 'geSetDefaultShippingAddress', {
        value: geSetDefaultShippingAddress
    });
};
