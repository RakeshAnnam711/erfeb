'use strict';

/**
 * Extension of the base module AddressModel
 * See also {@link app_storefront_base/cartridge/models/address.js}
 */
var _super = module.superModule;

/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @constructor
 */
function address(addressObject) {
    _super.call(this, addressObject);
    if (addressObject && addressObject.custom && addressObject.custom.taxnumber) {
        this.address.taxnumber = addressObject.custom.taxnumber;
    }
}

module.exports = address;
