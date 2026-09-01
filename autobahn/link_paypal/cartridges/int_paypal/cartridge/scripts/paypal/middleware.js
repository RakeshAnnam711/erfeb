'use strict';

const server = require('server');

const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const HookMgr = require('dw/system/HookMgr');
const Resource = require('dw/web/Resource');

const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
const constants = require('*/cartridge/config/constants');
const paypalUrls = require('*/cartridge/config/urls');

/**
 * Middleware to validate payment method and remove unnecessary
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validatePaymentMethod(req, res, next) {
    const basket = BasketMgr.getCurrentBasket();

    const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');

    if (!basket) {
        return next();
    }

    const billingForm = server.forms.getForm('billing');
    const paymentInstruments = basket.getPaymentInstruments();
    const paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrumentById(basket, billingForm.paypal.usedPaymentMethod.value);
    const isSavedCreditCardFlow = paypalPaymentInstrument
        && paypalPaymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
        && creditCardHelper.isSavedCardFlow();

    // if change payment from plugin payment method to different one then we remove paypal as payment instrument
    if (paypalPaymentInstrument && !constants.AVAILABLE_PM_IDS.includes(billingForm.paymentMethod.htmlValue)) {
        paymentInstrumentHelper.removePaypalPaymentInstrument(basket, paypalPaymentInstrument);

        return next();
    }

    // if change payment method from different one to paypal we remove already existing payment instrument
    if (!empty(paymentInstruments) && !paypalPaymentInstrument) {
        paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);

        return next();
    }

    // Removes the PAYPAL_CREDIT_CARD payment instrument if the saved credit card is used
    if (isSavedCreditCardFlow) {
        paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);

        return next();
    }

    return next();
}

/**
 * Middleware to parse req.body
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function parseBody(req, res, next) {
    try {
        const data = req.body && JSON.parse(req.body);

        res.parsedBody = data;
    } catch (error) {
        paypalUtils.createErrorLog(error);
        res.setStatusCode(500);
        res.print(paypalUtils.createErrorMsg());

        return;
    }

    next();
}

/**
 * Middleware to validate processor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateProcessor(req, res, next) {
    const processor = PaymentMgr.getPaymentMethod(constants.PAYMENT_METHOD_ID_PAYPAL).getPaymentProcessor();

    if (!processor) {
        paypalUtils.createErrorLog(Resource.msg('error.payment.processor.missing', 'checkout', null));
        res.setStatusCode(500);
        res.print(paypalUtils.createErrorMsg());

        return;
    }

    next();
}

/**
 * Middleware to remove non paypal payment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function removeNonPaypalPayment(req, res, next) {
    const basket = BasketMgr.getCurrentBasket();

    if (!basket) {
        return next();
    }

    if (!empty(basket.paymentInstruments)) {
        paymentInstrumentHelper.removeNonPayPalPaymentInstrument(basket);
    }

    return next();
}

/**
 * Middleware to validate handle hook
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateHandleHook(req, res, next) {
    const processor = PaymentMgr.getPaymentMethod(constants.PAYMENT_METHOD_ID_PAYPAL).getPaymentProcessor();

    if (!HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        paypalUtils.createErrorLog(Resource.msg('paypal.error.payment.processor.missing', 'paypalerrors', null));
        res.setStatusCode(500);
        res.print(paypalUtils.createErrorMsg());

        return;
    }

    next();
}

/**
 * Check if existed giftCert payment instruments fully cover total price of the order
* @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateGiftCertificateAmount(req, res, next) {
    const basket = BasketMgr.getCurrentBasket();

    const paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(basket);

    if (!paypalPaymentInstrument) {
        return next();
    }

    const calculatedNonGiftCertificateAmount = paymentInstrumentHelper.calculateNonGiftCertificateAmount(basket);

    if (calculatedNonGiftCertificateAmount.value !== 0) {
        return next();
    }

    if (basket.giftCertificatePaymentInstruments.length && calculatedNonGiftCertificateAmount.value === 0) {
        return next();
    }

    switch (this.name) {
        case 'SubmitPayment':
            res.json({
                form: server.forms.getForm('billing'),
                fieldErrors: [],
                serverErrors: [paypalUtils.createErrorMsg('order.covered.by.gift.certificate')],
                error: true,
                redirectUrl: paypalUrls.paymentStage
            });

            break;
        case 'StreamlinedCheckout':
            res.setStatusCode(500);
            res.print(paypalUtils.createErrorMsg('order.covered.by.gift.certificate'));

            break;
        default:
            next();

            break;
    }

    return next();
}

/**
 * Checks if 'connect with paypal window' was cancelled by buyer
* @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateConnectWithPaypalUrl(req, res, next) {
    const error = req.httpParameterMap.get('error_description');

    if (!error.empty && error.value === constants.CONNECT_WITH_PAYPAL_CONSENT_DENIED) {
        paypalUtils.createErrorLog(error.value);

        // Sets redirect endpoint depends of 'Connect with paypal' button location
        // oAuth reentry endpoint (Account - 1 or Checkout - 2)
        res.redirect(accountHelpers.getLoginRedirectURL(req.session.custom.oauthLoginTargetEndPoint, req.session.privacyCache, false));

        return;
    }

    next();
}

/**
 * Checks if amount is not zero
* @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateAmount(req, res, next) {
    if (BasketMgr.currentOrNewBasket.totalGrossPrice.value === 0) {
        res.setStatusCode(500);
        res.json({
            error: true,
            code: constants.ZERO_AMOUNT,
            errorMessage: Resource.msg('paypal.error.zeroamount', 'paypalerrors', null)
        });
    }

    next();
}

module.exports = {
    validatePaymentMethod: validatePaymentMethod,
    parseBody: parseBody,
    validateProcessor: validateProcessor,
    removeNonPaypalPayment: removeNonPaypalPayment,
    validateHandleHook: validateHandleHook,
    validateGiftCertificateAmount: validateGiftCertificateAmount,
    validateConnectWithPaypalUrl: validateConnectWithPaypalUrl,
    validateAmount: validateAmount
};
