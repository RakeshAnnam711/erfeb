'use strict';

module.exports = function (object) {
    var shippingPromotions;
    Object.defineProperties(object, {
        getShippingPromotions: {
            value: function () {
                var ArrayList = require('dw/util/ArrayList');
                var promotions = new ArrayList();
                var shippingPromotion;
                try {
                    var globalePromotion = require('*/cartridge/scripts/factories/globale/promotion');
                    var shippingPromotionsIter = this.super.getShippingPromotions.apply(this.super, Array.prototype.slice.call(arguments)).iterator();
                    while (shippingPromotionsIter.hasNext()) {
                        shippingPromotion = globalePromotion(shippingPromotionsIter.next());
                        if (shippingPromotion.isGlobalePromotion()) {
                            promotions.push(shippingPromotion);
                        }
                    }
                } catch (e) {
                    this.logger.error('getShippingPromotions: {0}', this.logger.message(e));
                }
                return promotions;
            }
        },
        shippingPromotions: {
            enumerable: true,
            get: function () {
                if (!shippingPromotions) {
                    shippingPromotions = this.getShippingPromotions();
                }
                return shippingPromotions;
            }
        }
    });
};
