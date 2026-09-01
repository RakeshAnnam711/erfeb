'use strict';

var Discount = require('dw/campaign/Discount');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Validates Promotion against basic custom attributes
 * @param {dw.campaign.Promotion} promotion - SFCC Promotion
 * @returns {boolean} - True or False
 */
function isValidGlobalePromotion(promotion) {
    if (promotion && promotion.active) {
        return true;
    }
    return false;
}

/**
 * Validates Promotion against Promotion Discount type
 * @param {dw.campaign.Promotion} promotion - SFCC Promotion
 * @returns {boolean} - True or False
 */
function isDiscountTypeAllowed(promotion) {
    if ([
        Discount.TYPE_AMOUNT, // product and order
        Discount.TYPE_BONUS, // product and order
        Discount.TYPE_BONUS_CHOICE, // product and order
        Discount.TYPE_FIXED_PRICE, // product only
        // Discount.TYPE_FIXED_PRICE_SHIPPING,
        Discount.TYPE_FREE,
        Discount.TYPE_PERCENTAGE, // product and order
        // Discount.TYPE_PERCENTAGE_OFF_OPTIONS, // product only
        Discount.TYPE_PRICEBOOK_PRICE, // product only
        Discount.TYPE_TOTAL_FIXED_PRICE // product only
    ].indexOf(promotion.custom[globaleHelpers.customAttr.promotion.geDiscountType].value) !== -1) {
        return true;
    }
    return false;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isGlobalePromotion: {
            value: function () {
                try {
                    if (isValidGlobalePromotion(this.super)) {
                        // Any other Global-e compatible Promotion
                        if (isDiscountTypeAllowed(this.super)) {
                            return true;
                        }
                    }
                } catch (e) {
                    this.logger.error('isGlobalePromotion: {0}', this.logger.message(e));
                }
                return false;
            }
        }
    });
};
