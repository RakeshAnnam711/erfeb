const { int_paypal: { urlsPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

const urls = proxyquire(urlsPath, {
    'dw/web/URLUtils': {
        https: (action) => ({
            toString: () => action
        }),
        url: (action) => ({
            toString: () => action
        })
    }
});

describe('urls', () => {
    describe('module.exports', () => {
        it('should return an object with urls', () => {
            expect(urls).to.deep.equal({
                accountAddPaypalHandler: 'Paypal-AccountAddPaypalHandler',
                cartPage: 'Cart-Show',
                chooseShippingUrl: 'Checkout-Begin',
                createApplePayOrder: 'ApplePay-CreateOrder',
                createSetupToken: 'CreditCard-CreateSetupToken',
                createSetupTokenForPaypal: 'Paypal-CreateSetupTokenForPaypal',
                cwppUrl: 'CWPP-Connect',
                deleteCreditCardUrl: 'CreditCard-Delete',
                deletePaypalAccount: 'Paypal-DeletePaypalAccount',
                finishLpm: 'Paypal-FinishLPM',
                finishLpmOrder: 'Paypal-FinishLpmOrder',
                getAmountForShippingOption: 'Paypal-GetAmountForShippingOption',
                getApplicableShippingOptions: 'Paypal-GetApplicableShippingOptions',
                getBasketData: 'Paypal-GetBasketData',
                getCartPurchaseUnit: 'Paypal-GetPurchaseUnit',
                getOrderBillingAddress: 'Paypal-OrderBillingAddress',
                getPaypalOrderId: 'Paypal-GetPaypalOrderId',
                getPurchaseUnit: 'Paypal-GetPurchaseUnit',
                makeCreditCardDefaultUrl: 'CreditCard-MakeDefault',
                myAccountUrl: 'Account-Show',
                paymentStage: 'Checkout-Begin',
                placeOrderStage: 'Checkout-Begin',
                removeAllProductsFromCart: 'Cart-RemoveAllProductsFromCart',
                removeSessionPayment: 'Fastlane-RemoveSessionPayment',
                renderAccountsUrl: 'CreditCard-RenderAccountsList',
                renderPayPalAccountsUrl: 'Paypal-RenderAccountsList',
                streamlinedCheckout: 'Paypal-StreamlinedCheckout',
                savePaypalDefaultAddress: 'AutomaticPaymentMethodAdding-SavePaypalDefaultAddress',
                setInitialShippingOption: 'Paypal-SetInitialShippingOption',
                unlinkCwppUrl: 'CWPP-Unlink',
                placeOrder: 'CheckoutServices-PlaceOrder',
                saveEnrichedNonce: 'Fastlane-SaveEnrichedNonce',
                createThreeDSecureParameters: 'Fastlane-CreateThreeDSecureParameters'
            });
        });
    });
});
