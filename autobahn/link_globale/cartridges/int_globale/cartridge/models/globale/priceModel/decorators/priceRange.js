'use strict';

module.exports = function (object) {
    var priceRange;
    Object.defineProperties(object, {
        isPriceRange: {
            value: function (priceBookId) {
                var minPrice;
                var maxPrice;
                try {
                    if (this.product && !this.product.variant) {
                        if (priceBookId) {
                            minPrice = this.getMinPriceBookPrice(priceBookId);
                            maxPrice = this.getMaxPriceBookPrice(priceBookId);
                        } else {
                            minPrice = this.getMinPrice();
                            maxPrice = this.getMaxPrice();
                        }
                        if (minPrice.available && maxPrice.available && (minPrice.value !== maxPrice.value)) {
                            return true;
                        }
                    }
                } catch (e) {
                    this.logger.error('isPriceRange: {0}', this.logger.message(e));
                }
                return false;
            }
        },
        priceRange: {
            enumerable: true,
            get: function () {
                if (priceRange === undefined) {
                    priceRange = this.isPriceRange();
                }
                return priceRange;
            }
        }
    });
};
