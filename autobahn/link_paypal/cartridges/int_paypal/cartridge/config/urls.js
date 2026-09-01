'use strict';

const URLUtils = require('dw/web/URLUtils');

const CHECKOUT_BEGIN = 'Checkout-Begin';

module.exports = {
    getPurchaseUnit: URLUtils.https('Paypal-GetPurchaseUnit').toString(),
    getCartPurchaseUnit: URLUtils.https('Paypal-GetPurchaseUnit', 'isCartFlow', 'true').toString(),
    streamlinedCheckout: URLUtils.https('Paypal-StreamlinedCheckout').toString(),
    cartPage: URLUtils.https('Cart-Show').toString(),
    placeOrderStage: URLUtils.https(CHECKOUT_BEGIN, 'stage', 'placeOrder').toString(),
    deletePaypalAccount: URLUtils.url('Paypal-DeletePaypalAccount').toString(),
    paymentStage: URLUtils.https(CHECKOUT_BEGIN, 'stage', 'payment').toString(),
    finishLpmOrder: URLUtils.url('Paypal-FinishLpmOrder').toString(),
    savePaypalDefaultAddress: URLUtils.url('AutomaticPaymentMethodAdding-SavePaypalDefaultAddress').toString(),
    getPaypalOrderId: URLUtils.https('Paypal-GetPaypalOrderId').toString(),
    finishLpm: URLUtils.url('Paypal-FinishLPM').toString(),
    cwppUrl: URLUtils.https('CWPP-Connect').toString(),
    removeAllProductsFromCart: URLUtils.https('Cart-RemoveAllProductsFromCart').toString(),
    unlinkCwppUrl: URLUtils.https('CWPP-Unlink').toString(),
    deleteCreditCardUrl: URLUtils.url('CreditCard-Delete').toString(),
    renderAccountsUrl: URLUtils.https('CreditCard-RenderAccountsList').toString(),
    renderPayPalAccountsUrl: URLUtils.https('Paypal-RenderAccountsList').toString(),
    myAccountUrl: URLUtils.https('Account-Show', 'registration', 'false').toString(),
    chooseShippingUrl: URLUtils.url(CHECKOUT_BEGIN, 'stage', 'shipping').toString(),
    makeCreditCardDefaultUrl: URLUtils.https('CreditCard-MakeDefault').toString(),
    createApplePayOrder: URLUtils.https('ApplePay-CreateOrder').toString(),
    getBasketData: URLUtils.https('Paypal-GetBasketData').toString(),
    getOrderBillingAddress: URLUtils.https('Paypal-OrderBillingAddress').toString(),
    createSetupToken: URLUtils.https('CreditCard-CreateSetupToken').toString(),
    createSetupTokenForPaypal: URLUtils.https('Paypal-CreateSetupTokenForPaypal').toString(),
    accountAddPaypalHandler: URLUtils.https('Paypal-AccountAddPaypalHandler').toString(),
    getApplicableShippingOptions: URLUtils.https('Paypal-GetApplicableShippingOptions').toString(),
    getAmountForShippingOption: URLUtils.https('Paypal-GetAmountForShippingOption').toString(),
    setInitialShippingOption: URLUtils.https('Paypal-SetInitialShippingOption').toString(),
    removeSessionPayment: URLUtils.https('Fastlane-RemoveSessionPayment').toString(),
    placeOrder: URLUtils.https('CheckoutServices-PlaceOrder').toString(),
    saveEnrichedNonce: URLUtils.url('Fastlane-SaveEnrichedNonce').toString(),
    createThreeDSecureParameters: URLUtils.url('Fastlane-CreateThreeDSecureParameters').toString()
};
