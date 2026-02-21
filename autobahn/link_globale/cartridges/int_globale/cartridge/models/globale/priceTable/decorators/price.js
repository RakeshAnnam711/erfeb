'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPrice: {
            value: function (quantity) {
                return this.priceModel.getPrice(quantity);
            }
        }
    });
};
