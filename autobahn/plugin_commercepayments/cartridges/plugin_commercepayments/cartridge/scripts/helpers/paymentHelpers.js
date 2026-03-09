'use strict';

var PAYMENT_INTENT_KEY = '__commercepayments_paymentintent';

/**
 * Gets the amount to be paid for the given basket or order. This is the total
 * gross price minus any applied gift certificates.
 * @param {Object} lineItemCtnr - either dw.orderBasket or dw.order.Order
 * @return {dw.value.Money} amount to be paid
 */
function getPaymentAmount(lineItemCtnr) {
    var amount = lineItemCtnr.totalGrossPrice;
    lineItemCtnr.giftCertificatePaymentInstruments.toArray().forEach(function (pi) {
        amount = amount.subtract(pi.paymentTransaction.amount);
    });
    return amount;
}

/**
 * Gets the SalesforcePaymentIntent for the given basket or order. Uses the one
 * cached in the current request if present, and retrieves it if not.
 * @param {Object} lineItemCtnr - either dw.order.Basket or dw.order.Order
 * @returns {dw.extensions.payments.SalesforcePaymentIntent} payment intent for the basket or order
 */
function getPaymentIntent(lineItemCtnr) {
    if (request.custom[PAYMENT_INTENT_KEY]) {
        return request.custom[PAYMENT_INTENT_KEY];
    }

    var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');

    var paymentIntent = SalesforcePaymentsMgr.getPaymentIntent(lineItemCtnr);
    request.custom[PAYMENT_INTENT_KEY] = paymentIntent;
    return paymentIntent;
}

/**
 * Removes any Commerce Payments-related payment instruments from the given basket.
 * It's required to remove these payment instruments in order to check out a basket
 * using another payment processor.
 * @param {dw.order.Basket} basket - basket whose Commerce Payments payment instruments to remove
 */
function removePaymentInstruments(basket) {
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        basket.getPaymentInstruments('Salesforce Payments').toArray().forEach(function (pi) {
            basket.removePaymentInstrument(pi);
        });
    });
}

/**
 * Gets Buy now data.
 * @param {Object} product - Product Model
 * @returns {Object} an object containing basket data and payment request options
 */
function getBuyNowData(product) {
    if (!product) return null;

    var Money = require('dw/value/Money');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var price;
    if (product.price.type === 'tiered') {
        for (var i = 0, l = product.price.tiers.length; i < l; i++) {
            if (product.price.tiers[i].quantity <= product.selectedQuantity) {
                price = product.price.tiers[i].price.sales;
            }
        }
    } else if (product.price.type === 'range') {
        price = product.price.min.sales;
    } else {
        price = product.price.sales;
    }

    var buyNowData = COHelpers.calculateBuyNowData(product.id, product.selectedQuantity, new Money(price.value, price.currency), product.options);

    return buyNowData;
}

/**
 * Return an object containing data to create a payment request button
 * @returns {Object} and object containing payment request information
 */
function createPaymentRequestData() {
    var BasketMgr = require('dw/order/BasketMgr');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');

    var name = UUIDUtils.createUUID();
    var paymentRequestId = 'paymentrequest-' + name;
    var elementClass = 'salesforce-paymentrequest-element-' + name;
    var errorsClass = 'salesforce-paymentrequest-element-errors-' + name;

    var paymentRequest = new SalesforcePaymentRequest(paymentRequestId, '.' + elementClass);
    paymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_APPLEPAY);
    paymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_PAYMENTREQUEST);

    var currentBasket = BasketMgr.currentBasket;
    var total = 0;
    if (currentBasket) {
        var paymentAmount = getPaymentAmount(currentBasket);
        if (paymentAmount.available) {
            total = paymentAmount.value;
        }
    }

    return {
        paymentRequestId: paymentRequestId,
        elementClass: elementClass,
        errorsClass: errorsClass,
        paymentRequest: paymentRequest,
        total: total
    };
}

module.exports = {
    getPaymentAmount: getPaymentAmount,
    getPaymentIntent: getPaymentIntent,
    removePaymentInstruments: removePaymentInstruments,
    getBuyNowData: getBuyNowData,
    createPaymentRequestData: createPaymentRequestData
};
