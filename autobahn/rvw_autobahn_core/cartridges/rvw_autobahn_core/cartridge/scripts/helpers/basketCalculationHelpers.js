'use strict';

var base = module.superModule;

/**
 * Calculate all totals as well as shipping and taxes
 * @param {dw.order.Basket} basket - current basket
 */
function calculateTotals(basket) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    if (COHelpers.hideShipping(basket)) {
        var defaultShipment = basket.getDefaultShipment()
        var shippingAddress = defaultShipment.getShippingAddress();
        var billingAddress = basket.getBillingAddress();
        if (!shippingAddress && billingAddress) {
            COHelpers.copyBillingAddressToShippingAddress(defaultShipment, billingAddress, shippingAddress)
        }
    }

    base.calculateTotals(basket);

    //basket calculations could cause the totalGrossPrice to change
    //we need to reapply gift certificates to make sure we don't apply into negative totals
    var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    checkoutHelpers.reApplyGiftCertificatePaymentInstruments(basket);
}

module.exports = {
    calculateTotals: calculateTotals
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
