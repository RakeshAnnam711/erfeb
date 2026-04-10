'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        isApplicable: {
            value: function () {
                var globalePromotion = require('*/cartridge/scripts/factories/globale/promotion');
                var result = false;

                if (this.priceAdjustment.promotion) {
                    var promotion = globalePromotion(this.priceAdjustment.promotion);
                    result = promotion.isGlobalePromotion();
                }

                return result;
            }
        }
    });
};
