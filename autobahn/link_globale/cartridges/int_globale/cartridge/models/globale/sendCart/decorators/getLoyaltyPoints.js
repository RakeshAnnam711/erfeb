'use strict';

/**
 * Returns the Loyalty Points object
 * @returns {Object} - Loyalty Points object
 */
function getLoyaltyPoints() {
    /**
     * Code used to populate LoyaltyPoints in SendCartData object.
     * The attributes that should be set
     * LoyaltyCreditPointsEarned                - Loyalty points to be earned from the purchase
     * LoyaltyPointOriginalValueForSpend        - Loyalty points in conversion to money. Amount denoted in the currency code of 'LoyaltyPointOriginalCurrencyForSpend' attribute
     * LoyaltyPointOriginalCurrencyForSpend     - Currency code
     * LoyaltyCreditCode                        - ID of Loyalty Card
     *
     * @example
     *    var result = null;
     *    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
     *    var globaleHelpers = require('int_globale/cartridge/scripts/helpers/globaleHelpers');
     *    var loyaltyCard = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coLoyaltyCards, '1625743016759');
     *    if (loyaltyCard) {
     *        result = {
     *            LoyaltyCreditPointsEarned: 100, // Int64
     *            LoyaltyPointOriginalValueForSpend: loyaltyCard.custom.currentBalance || 0, // decimal
     *            LoyaltyPointOriginalCurrencyForSpend: loyaltyCard.custom.originalCurrencyCode || 'GBP', // string
     *            LoyaltyCreditCode: loyaltyCard.custom.cardID || '1625743016759' // string
     *        };
     *    } else {
     *        result = null;
     *    }
     * @type {Object|null}
     */
    return null; // eslint-disable-line no-param-reassign
}

module.exports = function (object) {
    Object.defineProperty(object, 'getLoyaltyPoints', {
        value: getLoyaltyPoints
    });
};
