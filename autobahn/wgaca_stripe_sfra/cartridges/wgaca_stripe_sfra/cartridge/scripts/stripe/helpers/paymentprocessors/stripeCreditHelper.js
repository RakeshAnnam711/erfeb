/* eslint-env es6 */
/* global request, session */

'use strict';

var base = module.superModule;
var Transaction = require('dw/system/Transaction');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Resource = require('dw/web/Resource');

/**
 * Resolve Stripe PaymentMethod / source id for saved-card SubmitPayment.
 * Prefers httpParameterMap; falls back to session value set by CheckoutServices prepend
 * because writing req.form does not update httpParameterMap.
 * @returns {string}
 */
function resolveSourceId() {
    var paramsMap = request.httpParameterMap;
    return (paramsMap.stripe_source_id && paramsMap.stripe_source_id.stringValue)
        || (paramsMap.dwfrm_billing_creditCardFields_selectedCardID && paramsMap.dwfrm_billing_creditCardFields_selectedCardID.stringValue)
        || (paramsMap.saved_card_id && paramsMap.saved_card_id.stringValue)
        || (paramsMap.selectedCardID && paramsMap.selectedCardID.stringValue)
        || (paramsMap.dwfrm_billing_stripe_source_id && paramsMap.dwfrm_billing_stripe_source_id.stringValue)
        || (session.privacy.stripeCheckoutSourceId || '');
}

/**
 * Handle credit card payment (saved Stripe card / new card PM).
 * @param {Object} args Basket wrapper
 * @returns {Object} result
 */
function Handle(args) {
    var checkoutHelper = require('*/cartridge/scripts/stripe/helpers/checkoutHelper');
    var paramsMap = request.httpParameterMap;
    var cardType = require('*/cartridge/scripts/stripe/helpers/cardsHelper').getCardType();
    var sourceId = resolveSourceId();
    var cardNumber = paramsMap.stripe_card_number.stringValue;
    var cardHolder = paramsMap.stripe_card_holder.stringValue;
    var cardExpMonth = paramsMap.stripe_card_expiration_month.stringValue;
    var cardExpYear = paramsMap.stripe_card_expiration_year.stringValue;
    var postedCardType = paramsMap.dwfrm_billing_creditCardFields_cardType.stringValue;

    if (!sourceId) {
        return {
            success: false,
            error: true,
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        };
    }

    var prUsed = false;
    if (request.httpParameterMap.get('stripe_pr_used').value === 'true') {
        prUsed = true;
    }

    var params = {
        sourceId: sourceId,
        saveCard: paramsMap.stripe_save_card.value,
        prUsed: prUsed,
        saveGuessCard: paramsMap.stripe_save_guess_card.value
    };

    if (cardNumber) {
        params.cardNumber = cardNumber;
    }

    if (cardHolder) {
        params.cardHolder = cardHolder;
    }

    if (cardExpMonth) {
        params.cardExpMonth = cardExpMonth;
    }

    if (cardExpYear) {
        params.cardExpYear = cardExpYear;
    }

    if (cardType || postedCardType) {
        params.cardType = cardType || postedCardType;
    }

    try {
        Transaction.begin();
        checkoutHelper.createStripePaymentInstrument(args.Basket, PaymentInstrument.METHOD_CREDIT_CARD, params);
        Transaction.commit();
        delete session.privacy.stripeCheckoutSourceId;
        return {
            success: true,
            error: false
        };
    } catch (e) {
        Transaction.rollback();
        return {
            success: false,
            error: true,
            errorMessage: e.message
        };
    }
}

exports.Handle = Handle;
exports.Authorize = base.Authorize;
