'use strict';

var base = module.superModule;

function methodLabelFromCode(code) {
    if (!code) {
        return '';
    }

    var normalized = String(code).trim();
    if (!normalized) {
        return '';
    }

    var upper = normalized.toUpperCase();
    var labels = {
        AFFIRM: 'Affirm',
        STRIPE_AFFIRM: 'Affirm',
        KLARNA: 'Klarna',
        STRIPE_KLARNA: 'Klarna',
        APPLEPAY: 'Apple Pay',
        APPLE_PAY: 'Apple Pay',
        STRIPE_APPLEPAY: 'Apple Pay',
        STRIPE_APPLE_PAY: 'Apple Pay',
        GOOGLEPAY: 'Google Pay',
        GOOGLE_PAY: 'Google Pay',
        STRIPE_GOOGLEPAY: 'Google Pay',
        STRIPE_GOOGLE_PAY: 'Google Pay',
        AMAZON_PAY: 'Amazon Pay',
        STRIPE_AMAZON_PAY: 'Amazon Pay',
        AFTERPAY_CLEARPAY: 'Afterpay',
        AFTERPAY: 'Afterpay',
        STRIPE_AFTERPAY_CLEARPAY: 'Afterpay',
        STRIPE_AFTERPAY: 'Afterpay',
        STRIPE_PAYMENT_ELEMENT: 'Payment Element'
    };

    if (labels[upper]) {
        return labels[upper];
    }

    return normalized
        .replace(/^STRIPE_/i, '')
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
}

function looksLikeStripeToken(value) {
    if (!value) {
        return false;
    }

    return /^(pm_|src_|tok_|seti_|pi_)/i.test(String(value));
}

function toArray(collection) {
    if (!collection) {
        return [];
    }

    if (Array.isArray(collection)) {
        return collection;
    }

    if (typeof collection.toArray === 'function') {
        return collection.toArray();
    }

    var items = [];
    var iterator = collection.iterator && collection.iterator();

    while (iterator && iterator.hasNext()) {
        items.push(iterator.next());
    }

    return items;
}

/**
 * Payment model override to expose a friendly Stripe payment method label
 * for checkout review and order confirmation summaries.
 *
 * @param {dw.order.LineItemCtnr} currentBasket - basket or order
 * @param {dw.customer.Customer} currentCustomer - customer context
 * @param {string} countryCode - country code
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    if (!this.selectedPaymentInstruments || !this.selectedPaymentInstruments.length || !currentBasket) {
        return;
    }

    var apiPaymentInstruments = toArray(currentBasket.paymentInstruments);

    this.selectedPaymentInstruments.forEach(function (selectedPaymentInstrument, index) {
        var apiPaymentInstrument = apiPaymentInstruments[index];
        var paymentMethod = selectedPaymentInstrument && selectedPaymentInstrument.paymentMethod;
        var stripeSourceId = apiPaymentInstrument
            && apiPaymentInstrument.custom
            && apiPaymentInstrument.custom.stripeSourceID
            ? String(apiPaymentInstrument.custom.stripeSourceID)
            : '';

        var displayCode = paymentMethod;

        if (paymentMethod === 'STRIPE_PAYMENT_ELEMENT' && stripeSourceId && !looksLikeStripeToken(stripeSourceId)) {
            displayCode = stripeSourceId;
        }

        selectedPaymentInstrument.displayMethodName = methodLabelFromCode(displayCode || paymentMethod);
        selectedPaymentInstrument.stripeSourceID = stripeSourceId;
    });
}

module.exports = Payment;
