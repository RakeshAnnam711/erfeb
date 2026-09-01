'use strict';

const server = require('server');

const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');

const middleware = require('*/cartridge/scripts/paypal/middleware');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
const paypalApi = require('*/cartridge/scripts/paypal/api');
const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');

server.extend(module.superModule);

/**
 * Retrieves field errors from the provided data object
 * @param {Object} data - The data object containing field errors
 * @returns {Array} An array of field errors, or an empty array if no errors are found
 */
const getFieldErrors = function(data) {
    return data.fieldErrors || [];
};

/**
 * Whether currently selected billing method belongs to PayPal family.
 * @param {Object} billingForm SFRA billing form
 * @returns {boolean} true for PayPal/Venmo style methods
 */
const isPayPalFamilySelectedMethod = function(billingForm) {
    const methodValue = billingForm && billingForm.paymentMethod && billingForm.paymentMethod.value
        ? String(billingForm.paymentMethod.value).toLowerCase()
        : '';

    return methodValue.indexOf('paypal') > -1 || methodValue.indexOf('venmo') > -1;
};

/**
 * Checks for 3D Secure errors in the provided data object.
 * @param {Object} data - The data object containing error information.
 * @returns {boolean} True if there are 3D Secure errors, otherwise false.
 */
const checkFor3DSecureErrors = function(data) {
    const threeDSErrorText = Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null);

    return data.error && data.serverErrors.includes(threeDSErrorText);
};

server.append('SubmitPayment',
    middleware.validatePaymentMethod,
    middleware.validateGiftCertificateAmount,
    function(req, res, next) {
        this.on('route:BeforeComplete', function(_, res) { // eslint-disable-line no-shadow
            const currentBasket = BasketMgr.currentBasket;
            const billingForm = server.forms.getForm('billing');

            // Safety guard: do not run PayPal post-processing for non-PayPal selected methods
            // (e.g. Gift Certificate + Stripe Payment Element) even if stale PayPal PI exists.
            if (!isPayPalFamilySelectedMethod(billingForm)) {
                return;
            }

            const paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);

            if (!paypalPaymentInstrument) {
                return;
            }

            const viewData = res.getViewData();
            const fieldErrors = getFieldErrors(viewData);

            if (checkFor3DSecureErrors(viewData)) {
                return;
            }

            if (currentBasket.totalGrossPrice.value === 0) {
                res.json({
                    error: true,
                    fieldErrors: fieldErrors,
                    serverErrors: [paypalUtils.createErrorMsg('zeroamount')]
                });

                return;
            }

            if (paypalHelper.isExpiredTransaction(paypalPaymentInstrument)) {
                paypalHelper.handleExpiredTransaction(res, currentBasket);

                return;
            }

            const currencyCode = currentBasket.getCurrencyCode();

            const {
                noOrderIdChange,
                isOrderIdChanged
            } = paymentInstrumentHelper.getPaymentInstrumentAction(paypalPaymentInstrument);

            // if user goes through checkout with the same account we update order details if needed
            if (noOrderIdChange) {
                const purchaseUnit = paypalHelper.getPurchaseUnit(currentBasket);

                if (purchaseUnit.amount.value === '0.00') {
                    res.json({
                        error: true,
                        fieldErrors: fieldErrors,
                        serverErrors: [paypalUtils.createErrorMsg('zeroamount')]
                    });

                    return;
                }

                const OrderDataHash = require('*/cartridge/models/orderDataHash');
                const orderDataHashInstance = new OrderDataHash();

                const isUpdateRequired = paypalHelper.isPurchaseUnitChanged(purchaseUnit, paypalPaymentInstrument, orderDataHashInstance.get());

                if (isUpdateRequired) {
                    const updateOrderDetails = paypalApi.updateOrderDetails(paypalPaymentInstrument, purchaseUnit);

                    if (updateOrderDetails.err) {
                        res.json({
                            error: true,
                            fieldErrors: fieldErrors,
                            serverErrors: [updateOrderDetails.err]
                        });

                        return;
                    }

                    orderDataHashInstance.set(purchaseUnit);
                }
            }

            // if user changes from one account to another we update billing address and email
            if (isOrderIdChanged) {
                Transaction.wrap(function() {
                    paypalPaymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;

                    // update paymentId depending on whether it's venmo account or not
                    paypalHelper.updatePaymentId(paypalPaymentInstrument, billingForm);
                });

                const orderDetails = paypalApi.getOrderDetails(paypalPaymentInstrument);

                if (orderDetails.err) {
                    res.json({
                        error: true,
                        fieldErrors: fieldErrors,
                        serverErrors: [orderDetails.err]
                    });

                    return;
                }

                const payer = paypalHelper.getBillingAddressFromPaymentSource(orderDetails);

                addressHelper.updateOrderBillingAddress(currentBasket, payer);
                session.privacy.paypalPayerEmail = payer.email_address;
            }

            Transaction.wrap(function() {
                HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
            });

            const usingMultiShipping = false; // Current integration support only single shipping

            req.session.privacyCache.set('usingMultiShipping', usingMultiShipping);

            viewData.order.paymentMethodId = paypalPaymentInstrument.custom.paymentId;
            viewData.order.paypalPayerEmail = paypalPaymentInstrument.custom.currentPaypalEmail;

            paypalHelper.basketModelHack(viewData.order, currencyCode, paypalPaymentInstrument.custom);

            res.json(viewData);
        });

        next();
    });

server.prepend(
    'PlaceOrder',
    server.middleware.https,
    function(req, res, next) {
        const URLUtils = require('dw/web/URLUtils');

        const currentBasket = BasketMgr.currentBasket;

        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        const prefs = require('*/cartridge/config/preferences');

        const hasNoShippingAddress = currentBasket.defaultShipment.shippingAddress === null;

        if (prefs.isDigitalGoodsFlowEnabled && hasNoShippingAddress) {
            Transaction.wrap(function() {
                currentBasket.defaultShipment.createShippingAddress();
            });
        }

        return next();
    }
);

server.append('PlaceOrder', function(req, res, next) {
    if (res.viewData.error) {
        return next();
    }

    delete session.privacy.paypalOrderID;
    delete session.privacy.clientMetadataId;
    delete session.privacy.paymentToken;

    return next();
});

module.exports = server.exports();
