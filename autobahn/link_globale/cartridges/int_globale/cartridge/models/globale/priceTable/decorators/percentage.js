'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPercentage: {
            value: function (quantity) {
                var priceModelPrice = this.priceModel.price;
                var price = this.getPrice(quantity);
                return ((priceModelPrice.value - price.value) / (priceModelPrice.value / 100));
            }
        }
    });
};
