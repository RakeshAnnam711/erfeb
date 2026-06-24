'use strict';

module.exports = function (object) {
    var geQuantities;
    Object.defineProperties(object, {
        getNextQuantity: {
            value: function (quantity) {
                var Quantity = require('dw/value/Quantity');
                var basePriceQuantity = this.priceModel.getBasePriceQuantity();
                var nextQuantity = this.super.getNextQuantity.apply(this.super, Array.prototype.slice.call(arguments));
                var quantityPrice;
                var nextQuantityPrice;
                if (this.priceModel && this.priceModel.price && this.priceModel.price.fixedPrice && this.priceModel.price.fixedPriceBookId) {
                    nextQuantity = new Quantity((quantity.value + 1), ((basePriceQuantity && basePriceQuantity.unit) || ''));
                    quantityPrice = this.priceModel.getPriceBookPrice(this.priceModel.price.fixedPriceBookId, quantity);
                    nextQuantityPrice = this.priceModel.getPriceBookPrice(this.priceModel.price.fixedPriceBookId, nextQuantity);
                    if (quantityPrice.equals(nextQuantityPrice)) {
                        nextQuantity = null;
                    }
                }
                return nextQuantity;
            }
        },
        getQuantities: {
            value: function () {
                var ArrayList = require('dw/util/ArrayList');
                var Quantity = require('dw/value/Quantity');
                var basePriceQuantity = this.priceModel.getBasePriceQuantity();
                var quantities = this.super.getQuantities();
                var quantity;
                var priceBookPrice;
                var newPriceBookPrice;
                if (this.priceModel && this.priceModel.price && this.priceModel.price.fixedPrice === true && this.priceModel.price.fixedPriceBookId) {
                    quantities = new ArrayList();
                    quantity = new Quantity(1, ((basePriceQuantity && basePriceQuantity.unit) || ''));
                    while (quantity !== null) {
                        newPriceBookPrice = this.priceModel.getPriceBookPrice(this.priceModel.price.fixedPriceBookId, quantity);
                        if (!priceBookPrice || (priceBookPrice.available && !priceBookPrice.equals(newPriceBookPrice))) {
                            quantities.push(quantity);
                            priceBookPrice = newPriceBookPrice;
                            quantity = new Quantity((quantity.value + 1), ((basePriceQuantity && basePriceQuantity.unit) || ''));
                        } else {
                            quantity = null;
                        }
                    }
                }
                return quantities;
            }
        },
        quantities: {
            enumerable: true,
            get: function () {
                if (!geQuantities) {
                    geQuantities = this.getQuantities();
                }
                return geQuantities;
            }
        }
    });
};
