'use strict';

var Transaction = require('dw/system/Transaction');

var base = module.superModule;

function getFallbackPhone(lineItemCtnr, paymentSourceData) {
    var fromDigitalGoods = paymentSourceData
        && paymentSourceData.billingAddressDigitalGoods
        && paymentSourceData.billingAddressDigitalGoods.phone
        && paymentSourceData.billingAddressDigitalGoods.phone.phone_number
        && paymentSourceData.billingAddressDigitalGoods.phone.phone_number.national_number;

    if (fromDigitalGoods) {
        return String(fromDigitalGoods);
    }

    var shipment = lineItemCtnr && lineItemCtnr.defaultShipment;
    var shippingAddress = shipment && shipment.shippingAddress;

    if (shippingAddress && shippingAddress.phone) {
        return String(shippingAddress.phone);
    }

    return '0000000000';
}

function ensureBillingPhone(lineItemCtnr, paymentSourceData) {
    var billingAddress = lineItemCtnr && lineItemCtnr.billingAddress;

    if (!billingAddress || billingAddress.phone) {
        return;
    }

    var fallbackPhone = getFallbackPhone(lineItemCtnr, paymentSourceData);

    Transaction.wrap(function () {
        billingAddress.setPhone(fallbackPhone);
    });
}

base.updatePaymentSourceData = (function (superFn) {
    return function updatePaymentSourceData(paymentSourceData, orderData, params) {
        var lineItemCtnr = params && params.lineItemCtnr;

        if (paymentSourceData && paymentSourceData.card && lineItemCtnr) {
            ensureBillingPhone(lineItemCtnr, paymentSourceData);
        }

        return superFn.call(this, paymentSourceData, orderData, params);
    };
}(base.updatePaymentSourceData));

module.exports = base;
