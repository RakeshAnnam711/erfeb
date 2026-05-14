'use strict';

/**
 * Updates order shipments
 */
function geUpdateShipments() {
    var basket = this;

    // remove shipping price adjustments
    var shippingPriceAdjustments = basket.getAllShippingPriceAdjustments().iterator();
    while (shippingPriceAdjustments.hasNext()) {
        var shippingPriceAdjustment = shippingPriceAdjustments.next();
        basket.removePriceAdjustment(shippingPriceAdjustment);
    }

    // set shipping price to 0
    basket.geSetZeroShippingPrice();
    basket.updateTotals();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geUpdateShipments: {
            value: geUpdateShipments
        }
    });
};
