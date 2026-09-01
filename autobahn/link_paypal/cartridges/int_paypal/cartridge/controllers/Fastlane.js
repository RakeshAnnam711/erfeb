'use strict';

const server = require('server');

const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const constants = require('*/cartridge/config/constants');

server.post(
    'RemoveSessionPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const fastlaneHelpers = require('*/cartridge/scripts/paypal/helpers/fastlane');

        const currentBasket = BasketMgr.getCurrentBasket();
        const paymentToken = req.body ? JSON.parse(req.body).paymentToken : null;

        if (!currentBasket || !fastlaneHelpers.isFastlaneSessionPaymentsEnabled() || !paymentToken) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (session.privacy.paymentToken !== paymentToken) {
            res.json({ success: true });

            return next();
        }

        const paymentInstruments = currentBasket.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

        if (!paymentInstruments.empty) {
            const paymentInstrument = paymentInstruments[0];

            Transaction.wrap(function() {
                currentBasket.removePaymentInstrument(paymentInstrument);
            });

            delete session.privacy.paymentToken;
        }

        res.json({ success: true });

        return next();
    }
);

/**
 * Handles saving of the enriched nonce into the current basket's payment instrument.
 * This endpoint expects an POST request with a JSON body containing a `nonce`.
 * If the current basket or nonce is missing, it responds with an error and a redirect URL to the cart page.
 * Otherwise, it stores the nonce into the custom attribute `fastlanePaymentToken`
 * of the PayPal Credit Card payment instrument in the current basket.
 *
 * @name Fastlane-SaveEnrichedNonce
 * @function
 * @memberof Fastlane
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the chain.
 */
server.post(
    'SaveEnrichedNonce',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const utils = require('*/cartridge/scripts/paypal/utils');

        const currentBasket = BasketMgr.getCurrentBasket();

        const nonce = req.body ? utils.tryParseJSON(req.body).nonce : null;

        if (!currentBasket || !nonce) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        const paymentInstruments = currentBasket.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

        if (!paymentInstruments.empty) {
            const paymentInstrument = paymentInstruments[0];

            Transaction.wrap(function() {
                paymentInstrument.custom.fastlanePaymentToken = nonce;
            });
        }

        res.json({
            success: true
        });

        return next();
    }
);

/**
 * Handles the creation of 3D Secure parameters for the current basket used in the Fastlane (PayPal) checkout flow.
 * The route retrieves the current basket and generates the required 3D Secure parameters
 * by calling the `createThreeDSecureParameters` helper function.
 * If the basket is missing or an error occurs during parameter creation,
 * it returns a 500 status with an error flag in the response.
 * @name Fastlane-CreateThreeDSecureParameters
 * @function
 * @memberof Fastlane
 *
 * @param {Object} _ - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the chain.
 * @returns {void}
 * @throws {Error} If the basket is not found or processing fails.
 */
server.get('CreateThreeDSecureParameters',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(_, res, next) {
        const currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true
            });

            return next();
        }

        try {
            const fastlaneHelpers = require('*/cartridge/scripts/paypal/helpers/fastlane');

            const threeDSecureParameters = fastlaneHelpers.createThreeDSecureParameters(currentBasket);

            res.json(threeDSecureParameters);
        } catch (error) {
            res.setStatusCode(500);
            res.json({
                error: true
            });
        }

        return next();
    }
);

module.exports = server.exports();
