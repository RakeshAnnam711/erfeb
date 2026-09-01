'use strict';

const server = require('server');

const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
const prefs = require('*/cartridge/config/preferences');
const paypalConstants = require('~/cartridge/config/constants');
const paypalSDK = require('*/cartridge/config/sdk');
const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
const googlePayHelper = require('*/cartridge/scripts/paypal/helpers/googlePayHelper');

server.extend(module.superModule);

/**
 * General function for cart and minicart endpoints until logic are the same
 * @param  {Object} req request
 * @param  {Object} res response
 * @param  {Object} next next call
 * @returns {void}
 */
function payPalCartHandler(req, res, next) {
    const paypalApi = require('*/cartridge/scripts/paypal/api');

    const isExpressCheckout = true;
    const basket = BasketMgr.getCurrentBasket();
    const endpointName = this.name.toLowerCase() === 'show' ? 'cart' : 'minicart';
    const isPayPalCartButtonEnabled = paymentHelper.isElementEnabled(endpointName, paypalConstants.PAYPAL_BUTTON_LOCATION);
    const isVenmoButtonEnabled = paymentHelper.isVenmoEnabled(endpointName);
    const isPayPalButtonEnabled = isPayPalCartButtonEnabled && prefs.isPayPalPmActive;
    const isReturningCustomerEnabled = paypalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);
    const isPayPalButtonMessageEnabled = paymentHelper.isElementEnabled(endpointName, paypalConstants.PAYPAL_BUTTON_MESSAGE);

    if (!basket || !isPayPalButtonEnabled && !isVenmoButtonEnabled) {
        return next();
    }

    const utils = require('*/cartridge/scripts/paypal/utils');

    if (prefs.appSwitchEnabled && basket.productQuantityTotal === 0 && utils.isNotSameUserAgent()) {
        Transaction.wrap(function() {
            utils.addFlashMessagesCustomAttribute(
                basket,
                Resource.msg('return.to.original.browser', 'notifications', null),
                paypalConstants.FLASH_MESSAGE_WARNING
            );
        });
    }

    const paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(basket) || null;
    const paymentMethodId = paypalPaymentInstrument && paypalPaymentInstrument.custom.paymentId;
    const paypalEmail = paypalPaymentInstrument && paypalPaymentInstrument.custom.currentPaypalEmail;
    const isVenmoUsed = paymentMethodId === paypalConstants.PAYMENT_METHOD_ID_VENMO;

    let userIdToken = null;

    if (isReturningCustomerEnabled) {
        userIdToken = paypalApi.generateUserIdToken();
    }

    // Setting orderDataHash explicitly for route Paypal-UpdateOrderDetails when isUpdateRequired(isPaypalInstrumentExist)
    const purchaseUnits = [paypalHelper.getPurchaseUnit(basket, isExpressCheckout)];
    const OrderDataHash = require('*/cartridge/models/orderDataHash');
    const orderDataHashInstance = new OrderDataHash();

    orderDataHashInstance.set(purchaseUnits[0]);

    res.setViewData({
        paypal: {
            sdkUrl: paypalSDK.cartSdkUrl,
            partnerAttributionId: prefs.partnerAttributionId,
            cartButtonEnabled: isPayPalButtonEnabled,
            venmoOrPayPalButtonEnabled: isPayPalButtonEnabled || isVenmoButtonEnabled,
            buttonsToRender: JSON.stringify({
                paypal: isPayPalButtonEnabled,
                venmo: isVenmoButtonEnabled
            }),
            isPayPalButtonMessageEnabled: isPayPalButtonMessageEnabled,
            buttonConfig: endpointName === 'cart' ? prefs.paypalCartButtonConfig : prefs.paypalMinicartButtonConfig,
            buttonMessageConfig: paypalHelper.getButtonMessageConfig(endpointName, res),
            billingFormFields: paypalHelper.getPreparedBillingFormFields(paypalPaymentInstrument),
            paypalEmail: paypalEmail,
            isPaypalInstrumentExist: paypalPaymentInstrument && !empty(paypalPaymentInstrument),
            isVenmoUsed: isVenmoUsed,
            digitalGoodsData: {
                isDigitalGoodsFlowEnabled: prefs.isDigitalGoodsFlowEnabled
            },
            userIdToken: userIdToken,
            customerEmail: paypalHelper.getCustomerEmailOrEmpty()
        }
    });

    if (prefs.isDigitalGoodsFlowEnabled) {
        res.viewData.paypal.digitalGoodsData.currentBasketShipmentUUID = basket.defaultShipment.UUID;
    }

    paypalHelper.updateViewDataForFraudNet(res);

    return next();
}

/**
 * Adds Apple pay configs to the pdict if it is enabled
 * @param  {Object} res response
 * @param  {Object} next next call
 * @param  {string} pageFlow page flow
 * @returns {void}
 */
function applePayHandler(res, next, pageFlow) {
    const basket = BasketMgr.getCurrentBasket();
    const isApplePayCartButtonEnabled = paymentHelper.isElementEnabled(pageFlow, paypalConstants.APPLE_PAY_BUTTON_LOCATION);

    if (!prefs.isPayPalPmActive || !basket || !prefs.isApplePayPmActive || !isApplePayCartButtonEnabled) {
        return next();
    }

    const isApplePayEnabled = isApplePayCartButtonEnabled && prefs.isApplePayPmActive;

    if (!res.viewData.paypal) {
        res.viewData.paypal = {
            sdkUrl: paypalSDK.cartSdkUrl
        };
    }

    res.viewData.paypal.isApplePayEnabled = isApplePayEnabled;

    if (isApplePayEnabled) {
        res.viewData.paypal.applePayConfigs = paymentHelper.getApplePayConfigs(pageFlow);
        res.viewData.paypal.applePayFormFields = paypalHelper.getApplePayFormFields();
    }

    return next();
}

/**
 * Adds Google Pay configs to the pdict if it is enabled
 * @param  {Object} req request
 * @param  {Object} res response
 * @param  {Object} next next call
 * @returns {void}
 */
function googlePayHandler(req, res, next) {
    const basket = BasketMgr.getCurrentBasket();

    const endpointName = this.name.toLowerCase() === 'show' ? 'cart' : 'minicart';
    const isGooglePayCartButtonEnabled = paymentHelper.isElementEnabled(endpointName, paypalConstants.GOOGLE_PAY_BUTTON_LOCATION);

    if (!prefs.isPayPalPmActive || !basket || !prefs.isGooglePayActive || !isGooglePayCartButtonEnabled) {
        return next();
    }

    const isGooglePayEnabled = isGooglePayCartButtonEnabled && prefs.isGooglePayActive;

    if (!res.viewData.paypal) {
        res.viewData.paypal = {
            sdkUrl: paypalSDK.cartSdkUrl
        };
    }

    res.viewData.paypal.isGooglePayEnabled = isGooglePayEnabled;

    if (isGooglePayEnabled) {
        const billingForm = server.forms.getForm('billing');

        billingForm.clear();

        res.viewData.paypal.googlePayFormFields = googlePayHelper.getGooglePayFormFields(billingForm);
        res.viewData.paypal.googlePayConfigs = googlePayHelper.getGooglePayConfigs(endpointName);
    }

    return next();
}

/**
 * It removes all products from the current basket.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Object} next - The next function in the Express middleware chain.
 * @returns {void}
 */
function removeAllProductsHandler(req, res, next) {
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    const currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            message: Resource.msg('paypal.server.error', 'paypalerrors', null)
        });

        return next();
    }

    const productLineItems = currentBasket.getAllProductLineItems().toArray();

    Transaction.wrap(function() {
        productLineItems.forEach(function(item) {
            const shipmentToRemove = item.shipment;

            currentBasket.removeProductLineItem(item);

            if (shipmentToRemove && shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                currentBasket.removeShipment(shipmentToRemove);
            }
        });

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    res.json();

    return next();
}

server.append('Show', payPalCartHandler, googlePayHandler, function(req, res, next) {
    paypalHelper.processPaylaterMessagingConfiguration(req, res, paypalConstants.PAGE_FLOW_CART);

    applePayHandler(res, next, paypalConstants.PAGE_FLOW_CART);
});

server.append('MiniCartShow', csrfProtection.generateToken, payPalCartHandler, googlePayHandler, function(req, res, next) {
    applePayHandler(res, next, paypalConstants.PAGE_FLOW_MINICART);
});

server.prepend('AddProduct', function(req, res, next) {
    const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
    const currentBasket = BasketMgr.getCurrentOrNewBasket();

    if (prefs.isDigitalGoodsFlowEnabled) {
        addressHelper.applyOnlinePickupShippingMethodToBasket(currentBasket);
    }

    next();
});

server.get('RemoveAllProductsFromCart', server.middleware.https, csrfProtection.validateAjaxRequest, removeAllProductsHandler);

module.exports = server.exports();
