'use strict';

module.exports = function (object) {
    var productPromotions;
    Object.defineProperties(object, {
        getProductPromotions: {
            value: function () {
                var ArrayList = require('dw/util/ArrayList');
                var promotions = new ArrayList();
                var productPromotion;
                try {
                    var globalePromotion = require('*/cartridge/scripts/factories/globale/promotion');
                    var productPromotionsIter = this.super.getProductPromotions.apply(this.super, Array.prototype.slice.call(arguments)).iterator();
                    while (productPromotionsIter.hasNext()) {
                        productPromotion = globalePromotion(productPromotionsIter.next());
                        if (productPromotion.isGlobalePromotion()) {
                            promotions.push(productPromotion);
                        }
                    }
                } catch (e) {
                    this.logger.error('getProductPromotions: {0}', this.logger.message(e));
                }
                return promotions;
            }
        },
        productPromotions: {
            enumerable: true,
            get: function () {
                if (!productPromotions) {
                    productPromotions = this.getProductPromotions();
                }
                return productPromotions;
            }
        }
    });
};
