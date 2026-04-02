'use strict';

/**
 * Returns the Loyalty Data to Global-e SendCartData object
 * @param {Object} sendCartDiscounts - Global-e SendCart.Discounts object
 * @returns {Object} - the Loyalty Data
 */
function getCartLoyaltyData(sendCartDiscounts) {
    var ArrayList = require('dw/util/ArrayList');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var loyaltyPromotionSpentPointsFactor = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geLoyaltyPromotionSpentPointsFactor);
    var loyaltyPromotionEarnedPointsFactor = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geLoyaltyPromotionEarnedPointsFactor);

    var result = null;

    // Loyalty Points redeem (Spent) based on standard SFCC Promotion
    var loyaltyPromotionDiscount = collections.find(new ArrayList(sendCartDiscounts), function (discount) {
        return (discount.DiscountType === 3);
    });

    if (loyaltyPromotionDiscount && loyaltyPromotionDiscount.DiscountType === 3) {
        result = { // eslint-disable-line no-param-reassign
            LoyaltyCode: (('CouponCode' in loyaltyPromotionDiscount) ? loyaltyPromotionDiscount.CouponCode : null),
            LoyaltyPointsSpent: (loyaltyPromotionSpentPointsFactor ? (loyaltyPromotionDiscount.OriginalDiscountValue * loyaltyPromotionSpentPointsFactor) : null), // decimal
            LoyaltyPointsEarned: (loyaltyPromotionEarnedPointsFactor ? (loyaltyPromotionDiscount.OriginalDiscountValue * loyaltyPromotionEarnedPointsFactor) : null), // decimal
            LoyaltyPointsTotal: (loyaltyPromotionSpentPointsFactor ? (loyaltyPromotionDiscount.OriginalDiscountValue * loyaltyPromotionSpentPointsFactor) : null) // decimal
        };
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCartLoyaltyData', {
        value: getCartLoyaltyData
    });
};
