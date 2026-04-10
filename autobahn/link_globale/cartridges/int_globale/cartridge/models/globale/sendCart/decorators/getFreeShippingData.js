'use strict';

/**
 * Calculates and returns Global-e SendCart.FreeShipping API
 * @returns {Object} - Global-e SendCart.FreeShipping API
 */
function getFreeShippingData() {
    var Discount = require('dw/campaign/Discount');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var cartFreeShippingData = {
        IsFreeShipping: false,
        FreeShippingCouponCode: null,
        ForceFreeShippingForHierarchyId: null
    };

    var shippingPriceAdjustments = this.basket.getAllShippingPriceAdjustments().iterator();
    while (shippingPriceAdjustments.hasNext()) {
        var shippingPriceAdjustment = shippingPriceAdjustments.next();
        if (shippingPriceAdjustment.appliedDiscount.type === Discount.TYPE_FREE) {
            cartFreeShippingData.IsFreeShipping = true;
            if (shippingPriceAdjustment.isBasedOnCoupon()) {
                cartFreeShippingData.FreeShippingCouponCode = shippingPriceAdjustment.couponLineItem.couponCode;
            }

            if (shippingPriceAdjustment.promotion && shippingPriceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geFreeShippingMethod]) {
                var geFreeShippingMethod = shippingPriceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geFreeShippingMethod];
                cartFreeShippingData.ForceFreeShippingForHierarchyId = geFreeShippingMethod ? String(geFreeShippingMethod) : null;
            }
        }
    }
    return cartFreeShippingData;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getFreeShippingData', {
        value: getFreeShippingData
    });
};
