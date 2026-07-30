
'use strict';

var Money = require('../value/Money');

/**
 * Mock of dw.order.ProductLineItem
 */
function ProductLineItem() {
    this.UUID = 'uuid';
    this.proratedPrice = new Money();
    this.taxClassID = 'standard';
    this.tax = new Money();
    this.tax.value = 10;
    this.lineItemText = 'line item name';
    this.priceValue = 100;
    this.quantity = 1;

    this.getUUID = function () {
        return this.UUID;
    };

    this.updateTax = function () {

    };

    this.getProratedPrice = function () {
        return this.proratedPrice;
    };

    this.getTaxClassID = function () {
        return this.taxClassID;
    };

    this.getTax = function () {
        return this.tax;
    };

    this.getLineItemText = function () {
        return this.lineItemText;
    };

    this.getPriceValue = function () {
        return this.priceValue;
    };

    this.getQuantity = function () {
        return {
            getValue: function () {
                return 1;
            }
        };
    };
}

module.exports = ProductLineItem;
