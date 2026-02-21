'use strict';

/**
 * Get total of all types of Gift Cards (Regular Gift Cards, Loyalty Gift Cards)
 * @param {dw.order.Order} order - SFCC Order
 * @returns {number} - Gift Cards discounts
 */
function getAllGiftCardsTotal(order) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var allGiftCardsTotal = 0;
    collections.forEach(order.paymentInstruments, function (paymentInstrument) {
        var gePaymentMethodType = paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodType]
            ? paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodType].value
            : null;
        var gePaymentAmountInCustomerCurrency = paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentAmountInCustomerCurrency];
        if (
            gePaymentMethodType &&
            [globaleHelpers.consts.geGiftCardPaymentType, globaleHelpers.consts.geLoyaltyCardPaymentType].indexOf(gePaymentMethodType) !== -1 &&
            !isNaN(gePaymentAmountInCustomerCurrency) && Number(gePaymentAmountInCustomerCurrency) > 0 // eslint-disable-line no-restricted-globals
        ) {
            allGiftCardsTotal += gePaymentAmountInCustomerCurrency;
        }
    });
    return allGiftCardsTotal;
}

/**
 * Get amounts of all types of Gift Cards (Regular Gift Cards, Loyalty Gift Cards)
 * @param {dw.order.Order} order - SFCC Order
 * @returns {Object} - Object with amounts of Gift Cards
 */
function getAllGiftCardsAmounts(order) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
    var geOrder = geOrderMgr.get(order);
    var orders = [geOrder];
    // handle Mixed order scenario
    if (geOrder.geIsMixedMainOrder()) {
        orders = orders.concat(geOrder.geGetMixedSubOrders());
    }
    var amounts = {
        giftCardsAmounts: [],
        loyaltyCardsAmounts: []
    };
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    orders.forEach(function (orderItem) {
        collections.forEach(orderItem.paymentInstruments, function (paymentInstrument) {
            var gePaymentMethodType = paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodType]
                ? paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodType].value
                : null;
            var gePaymentAmountInCustomerCurrency = paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentAmountInCustomerCurrency];
            if (
                gePaymentMethodType && globaleHelpers.consts.geGiftCardPaymentType === gePaymentMethodType &&
                !isNaN(gePaymentAmountInCustomerCurrency) && Number(gePaymentAmountInCustomerCurrency) > 0 // eslint-disable-line no-restricted-globals
            ) {
                amounts.giftCardsAmounts.push(globaleMoney(gePaymentAmountInCustomerCurrency, currencyCode).toFormattedString());
            } else if (
                gePaymentMethodType && globaleHelpers.consts.geLoyaltyCardPaymentType === gePaymentMethodType &&
                !isNaN(gePaymentAmountInCustomerCurrency) && Number(gePaymentAmountInCustomerCurrency) > 0 // eslint-disable-line no-restricted-globals
            ) {
                amounts.loyaltyCardsAmounts.push(globaleMoney(gePaymentAmountInCustomerCurrency, currencyCode).toFormattedString());
            }
        });
    });

    return amounts;
}

module.exports = {
    getAllGiftCardsTotal: getAllGiftCardsTotal,
    getAllGiftCardsAmounts: getAllGiftCardsAmounts
};
