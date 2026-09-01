'use strict';

const Transaction = require('dw/system/Transaction');
const Money = require('dw/value/Money');
const PaymentMgr = require('dw/order/PaymentMgr');
const paypalConstants = require('*/cartridge/config/constants');

/**
 * Returns all payment methods id's array related to the PAYPAL processor
 * @returns {array} An array of payment methods ids
 */
function getPaymentMethodsIdWithPaypalProcessor() {
    const activePaymentMethods = PaymentMgr.getActivePaymentMethods();

    return Array.filter(activePaymentMethods, function(paymentMethod) {
        return paypalConstants.ALLOWED_PROCESSORS_IDS.includes(
            paymentMethod.paymentProcessor && paymentMethod.paymentProcessor.ID
        );
    }).map(function(paymentMethod) {
        return paymentMethod.ID;
    });
}

/**
 * Returns a customer payment instrument by UUID
 * @param {string} uuid Payment instrument's UUID
 * @returns {dw.customer.CustomerPaymentInstrument|undefined} Customer payment instrument
 */
function getCustomerPiByUUID(uuid) {
    return customer.profile.wallet.paymentInstruments.toArray().find(function(pi) {
        return pi.getUUID() === uuid;
    });
}

/**
 * Returns a customer payment instrument by creditCardToken
 * @param {string} token Payment instrument's creditCardToken
 * @param {dw.customer.Profile} profile - A customer profile
 * @returns {dw.customer.CustomerPaymentInstrument|undefined} Customer payment instrument
 */
function getCustomerPiByCreditCardToken(token, profile) {
    const customerProfile = customer.profile || profile;

    return customerProfile.wallet.paymentInstruments.toArray().find(function(pi) {
        return pi.creditCardToken === token;
    });
}

/**
 * Returns a customer payment instrument by email
 * @param {string} email Payment instrument's email
 * @returns {dw.customer.CustomerPaymentInstrument|undefined} Customer payment instrument
 */
function getCustomerPIByVaultEmail(email) {
    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

    return customer.profile.wallet.paymentInstruments.toArray().find(function(pi) {
        return paypalHelper.getCustomAttributePaypalEmail(pi) === email;
    });
}

/**
 * Calculates the amount to be paid by a non-gift certificate payment instrument based
 * on the given basket. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 *
 * @param {Object} lineItemCtnr - lineItemCtnr Container (Basket or Order)
 * @returns {dw.value.Money} non gift certificate amount
 */
function calculateNonGiftCertificateAmount(lineItemCtnr) {
    const gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    const iter = gcPaymentInstrs.iterator();

    let giftCertTotal = new Money(0.0, lineItemCtnr.currencyCode);
    let orderPI = null;

    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    const orderTotal = lineItemCtnr.totalGrossPrice;

    return orderTotal.subtract(giftCertTotal);
}

/**
 * Returns PayPal order payment instrument
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Basket or order
 * @returns {dw.order.OrderPaymentInstrument|undefined} payment instrument with processor id PAYPAL
 */
function getPaypalPaymentInstrument(lineItemCtnr) {
    const availablePaymentMethods = getPaymentMethodsIdWithPaypalProcessor();

    let paymentInstrument;

    availablePaymentMethods.forEach(function(pmId) {
        const pi = lineItemCtnr.getPaymentInstruments(pmId);

        if (!empty(pi)) {
            paymentInstrument = pi[0];
        }
    });

    return paymentInstrument;
}

/**
 * Returns PayPal order payment instrument
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Basket or order
 * @param {string} pmId Payment method id
 * @returns {dw.order.OrderPaymentInstrument} payment instrument with processor id PAYPAL
 */
function getPaypalPaymentInstrumentById(lineItemCtnr, pmId) {
    const pi = lineItemCtnr.getPaymentInstruments(pmId);

    return !empty(pi) && pi[0];
}

/**
 * Delete PayPal payment instrument from Basket or passed specific payment instrument
 *
 * @param {dw.order.LineItemCtnr} basket - Basket
 * @param  {dw.order.PaymentInstrument} [paypalPaymentInstrument] payment instrument to remove
 */
function removePaypalPaymentInstrument(basket, paypalPaymentInstrument) {
    if (!paypalPaymentInstrument) {
        const paymentInstruments =  basket.getPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);

        paypalPaymentInstrument = paymentInstruments && paymentInstruments.length ? paymentInstruments[0] : paymentInstruments;
    }

    if (empty(paypalPaymentInstrument)) {
        return;
    }

    Transaction.wrap(function() {
        basket.removePaymentInstrument(paypalPaymentInstrument);
    });
}

/**
 * Removes the PayPal payment instrument by the specified email from the current basket.
 *
 * @param {dw.order.Basket} basket The current basket.
 * @param {string} email The specified email.
 * @returns {void}
 */
function removePayPalPaymentInstrumentByEmail(basket, email) {
    const paymentInstrument = basket.getPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL).toArray().find(function(pi) {
        return pi.custom.currentPaypalEmail === email;
    });

    if (paymentInstrument) {
        Transaction.wrap(function() {
            basket.removePaymentInstrument(paymentInstrument);
        });
    }
}

/**
 * CreatePaymentInstrument
 *
 * @param {Object} basket - Basket
 * @param {string} paymentType - Name of the payment method.
 * @returns {dw.order.PaymentInstrument|null} Payment instrument
 */
function createPaymentInstrument(basket, paymentType) {
    const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');

    const amount = calculateNonGiftCertificateAmount(basket);
    const isSavedCardFlow = creditCardHelper.isSavedCardFlow();
    const paypalAccount = request.httpParameterMap.restPaypalAccountsList.stringValue;
    const isSavedPaypalFlow = customer.authenticated && paypalAccount && paypalAccount !== 'newaccount';
    const paymentProcessor = PaymentMgr.getPaymentMethod(paymentType).getPaymentProcessor();

    let paymentInstrument = null;

    Transaction.wrap(function() {
        if (isSavedCardFlow) {
            paymentInstrument = basket.createPaymentInstrumentFromWallet(getCustomerPiByUUID(
                request.httpParameterMap.paypalCreditCardList.stringValue), amount
            );
        } else if (isSavedPaypalFlow) {
            paymentInstrument = basket.createPaymentInstrumentFromWallet(
                getCustomerPIByVaultEmail(paypalAccount), amount
            );
        } else {
            paymentInstrument = basket.createPaymentInstrument(paymentType, amount);
        }

        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
    });

    return paymentInstrument;
}

/**
 * Removes payment instruments from Basket except GIFT_CERTIFICATE
 *
 * @param {Object} basket - Basket
 */
function removeNonPayPalPaymentInstrument(basket) {
    const paymentInstruments = basket.getPaymentInstruments();
    const iterator = paymentInstruments.iterator();

    let paymentInstrument = null;

    Transaction.wrap(function() {
        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                /* eslint-disable no-continue */
                continue;
            }

            basket.removePaymentInstrument(paymentInstrument);
        }
    });
}

/**
 * Check an update type of action for payment instrument
 * @param  {dw.order.PaymentInstrument} paypalPaymentInstrument active payment instrument
 * @returns {Object} action type
 */
function getPaymentInstrumentAction(paypalPaymentInstrument) {
    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

    const paypalOrderID = paypalPaymentInstrument.custom.paypalOrderID;
    const noOrderIdChange = paypalOrderID && paypalOrderID === session.privacy.paypalOrderID;
    const isOrderIdChanged = paypalOrderID && paypalOrderID !== session.privacy.paypalOrderID
        && !paypalHelper.isFastlaneUsed(paypalPaymentInstrument);

    return {
        noOrderIdChange: noOrderIdChange,
        isOrderIdChanged: isOrderIdChanged
    };
}

/**
 * Get last added PayPal payment instrument
 * @param {Array<dw.customer.CustomerPaymentInstrument>} paypalPaymentInstruments - active payment instrument
 * @returns {dw.customer.CustomerPaymentInstrument | undefined} - last added PayPal payment instrument or undefined
 */
function getLastAddedPaypalPaymentInstrument(paypalPaymentInstruments) {
    if (empty(paypalPaymentInstruments)) {
        return undefined;
    }

    return paypalPaymentInstruments.reduce((latest, current) => {
        const currentAccount = current.creationDate;
        const latestAccount = latest.creationDate;

        return (currentAccount > latestAccount) ? current : latest;
    });
}

module.exports = {
    calculateNonGiftCertificateAmount: calculateNonGiftCertificateAmount,
    createPaymentInstrument: createPaymentInstrument,
    removePaypalPaymentInstrument: removePaypalPaymentInstrument,
    getPaypalPaymentInstrument: getPaypalPaymentInstrument,
    removeNonPayPalPaymentInstrument: removeNonPayPalPaymentInstrument,
    getPaymentInstrumentAction: getPaymentInstrumentAction,
    removePayPalPaymentInstrumentByEmail: removePayPalPaymentInstrumentByEmail,
    getCustomerPiByUUID: getCustomerPiByUUID,
    getCustomerPiByCreditCardToken: getCustomerPiByCreditCardToken,
    getPaypalPaymentInstrumentById: getPaypalPaymentInstrumentById,
    getLastAddedPaypalPaymentInstrument: getLastAddedPaypalPaymentInstrument
};
