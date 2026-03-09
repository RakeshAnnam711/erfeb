'use strict';

/**
 * Sets shipment shipping price
 * @param {dw.value.Money} shippingPrice - shipping price
 * @param {number} vatRate - VAT Rate
 */
function geSetShipmentShippingPrice(shippingPrice, vatRate) {
    var Transaction = require('dw/system/Transaction');
    var TaxMgr = require('dw/order/TaxMgr');
    var Money = require('dw/value/Money');

    // tax amount
    var taxAmount;
    if (TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_NET) {
        taxAmount = (shippingPrice * vatRate);
    } else {
        taxAmount = (shippingPrice * (1 - (1 / (1 + vatRate))));
    }

    // update shippingLineItems price
    var shippingLineItems = this.getShippingLineItems().iterator();
    while (shippingLineItems.hasNext()) {
        var shippingLineItem = shippingLineItems.next();
        try {
            Transaction.wrap(function () { // eslint-disable-line no-loop-func
                shippingLineItem.setTaxClassID(TaxMgr.customRateTaxClassID);
                shippingLineItem.setPriceValue(shippingPrice.value);
                shippingLineItem.updateTaxAmount(new Money(taxAmount, shippingPrice.currencyCode));
                shippingLineItem.updateTax(vatRate, shippingPrice);
            });
        } catch (e) {} // eslint-disable-line no-empty
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geSetShipmentShippingPrice: {
            value: geSetShipmentShippingPrice
        }
    });
};
