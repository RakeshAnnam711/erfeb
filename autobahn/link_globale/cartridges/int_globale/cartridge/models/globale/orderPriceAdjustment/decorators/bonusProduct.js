'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getBonusProductPrice: {
            value: function () {
                var price = this.priceAdjustment.price;
                return price;
            }
        }
    });
};
