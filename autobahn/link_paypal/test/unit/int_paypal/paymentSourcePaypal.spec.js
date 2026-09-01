const { int_paypal: { paymentSourcePaypalHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const paymentSourceData = {
    paypal: null
};

const purchaseUnit = {};

const getShippingPreference = stub();
const isReturningCustomerExperienceEnabled = stub();
const https = stub();
const isShippingCallback = stub();
const getShippingCallbackUrl = stub();

const constants = {
    CONTACT_PREFERENCE_UPDATE_CONTACT_INFO: 'UPDATE_CONTACT_INFO',
    CONTACT_PREFERENCE_RETAIN_CONTACT_INFO: 'RETAIN_CONTACT_INFO',
    CONTACT_PREFERENCE_NO_CONTACT_INFO: 'NO_CONTACT_INFO',
    USER_ACTION_PAY_NOW: 'PAY_NOW',
    USER_ACTION_CONTINUE: 'CONTINUE',
    PAGE_FLOW_CHECKOUT: 'checkout',
    PAGE_FLOW_CART: 'cart',
    PAGE_FLOW_PRODUCT: 'product',
    PAGE_FLOW_MINICART: 'minicart'
};

const url = 'url';

const paymentSourcePaypalHelper = proxyquire(paymentSourcePaypalHelperPath, {
    '*/cartridge/config/constants': constants,
    '~/cartridge/scripts/paypal/helpers/paymentSource': {
        getShippingPreference: getShippingPreference,
        isShippingCallback: isShippingCallback,
        getShippingCallbackUrl: getShippingCallbackUrl,
        processOrderUpdateCallbackConfig: () => {
            paymentSourceData.paypal.experience_context.order_update_callback_config = {
                callback_events: ['SHIPPING_ADDRESS', 'SHIPPING_OPTIONS'],
                callback_url: url
            };
        }
    },
    '~/cartridge/scripts/paypal/helpers/paypalHelper': {
        isReturningCustomerExperienceEnabled: isReturningCustomerExperienceEnabled
    },
    'dw/web/URLUtils': {
        https: https
    },
    'dw/util/StringUtils': {
        encodeBase64: str => Buffer.from(str).toString('base64')
    },
    '~/cartridge/config/urls': {
        cartPage: 'https://example.com/en-US/Cart-Show'
    },
    '~/cartridge/scripts/paypal/utils': {
        getUserAgent: () => 'user-agent',
        reverseString: str => str.split('').reverse().join('')
    }
});

describe('paymentSourcePaypal file', () => {
    describe('processPaypalPaymentSourceData', () => {
        const shippingData = {};
        const originalPaymentSource = JSON.parse(JSON.stringify(paymentSourceData));

        let isExpressCheckout = true;
        let appSwitchEnabled = false;

        const originRequest = request;
        const lineItemCtnr = {
            UUID: 'cart_id'
        };

        before(() => {
            https.returns({
                toString: () => url
            });
            request = {
                httpCookies: {
                    dwsid: 'session_id'
                },
                httpParameterMap: {
                    pid: { stringValue: 'product-id' },
                    currentPage: { stringValue: 'home' }
                }
            };
        });

        after(() => {
            https.reset();
            request = originRequest;
        });

        afterEach(() => {
            customer.authenticated = false;
            customer.registered = false;
        });

        it('should not change paypal payment source data if it is null', () => {
            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(originalPaymentSource).to.deep.equals(paymentSourceData);
        });

        it('should not change paypal payment source data if vault_id is passed', () => {
            paymentSourceData.paypal = {
                vault_id: 'vault_id'
            };

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(Object.keys(paymentSourceData.paypal).length === 1).to.be.true;
            expect(paymentSourceData.paypal).to.haveOwnProperty('vault_id');
        });

        it('should add contact preference UPDATE_CONTACT_INFO to the payment source on express checkout if customer is guest', () => {
            paymentSourceData.paypal = {
                experience_context: {
                    brand_name: 'Store'
                }
            };

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.contact_preference).to.equals(constants.CONTACT_PREFERENCE_UPDATE_CONTACT_INFO);
        });

        it('should add contact preference RETAIN_CONTACT_INFO to the payment source on express checkout if customer is registered', () => {
            customer.authenticated = true;
            customer.registered = true;

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.contact_preference).to.equals(constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO);
        });

        it('should set NO_CONTACT_INFO if digital goods flow is enabled', () => {
            const isDigitalGoodsEnabled = true;

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, isDigitalGoodsEnabled, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.contact_preference).to.equals(constants.CONTACT_PREFERENCE_NO_CONTACT_INFO);
        });

        it('should add contact preference NO_CONTACT_INFO to the payment source on checkout page', () => {
            isExpressCheckout = false;

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.contact_preference).to.equals(constants.CONTACT_PREFERENCE_NO_CONTACT_INFO);
        });

        it('should add contact preference RETAIN_CONTACT_INFO to the payment source on checkout page', () => {
            shippingData.phone_number = { national_number: '5555555555' };

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.contact_preference).to.equals(constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO);
        });

        it('should add user action PAY_NOW if streamlined checkout is enabled', () => {
            const isStreamlinedCheckout = true;

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, isStreamlinedCheckout, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.user_action).to.equals(constants.USER_ACTION_PAY_NOW);
        });

        it('should add user action Continue if streamlined checkout is disabled', () => {
            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.user_action).to.equals(constants.USER_ACTION_CONTINUE);
        });

        it('should add shipping callback config', () => {
            paymentSourcePaypalHelper.processPaypalPaymentSourceData({ paymentSourceData, isExpressCheckout, shippingData, lineItemCtnr });

            expect(paymentSourceData.paypal.experience_context.order_update_callback_config).to.deep.equals({
                callback_events: ['SHIPPING_ADDRESS', 'SHIPPING_OPTIONS'],
                callback_url: url
            });
        });

        it('should disable app switch', () => {
            paymentSourcePaypalHelper.processPaypalPaymentSourceData({
                paymentSourceData,
                isExpressCheckout,
                shippingData,
                lineItemCtnr,
                appSwitchEnabled
            });

            expect(paymentSourceData.paypal.experience_context.app_switch_preference).to.be.undefined;
        });

        it('should enable app switch', () => {
            appSwitchEnabled = true;

            paymentSourcePaypalHelper.processPaypalPaymentSourceData({
                paymentSourceData,
                isExpressCheckout,
                shippingData,
                lineItemCtnr,
                appSwitchEnabled
            });

            expect(paymentSourceData.paypal.experience_context.app_switch_preference.launch_paypal_app).to.be.true;
            expect(paymentSourceData.paypal.experience_context).to.have.property('return_url');
            expect(paymentSourceData.paypal.experience_context).to.have.property('cancel_url');
        });
    });

    describe('addContactInfoToPurchaseUnit', () => {
        const currentBasket = {
            customerEmail: 'test@g.com',
            defaultShipment: {
                shippingAddress: {
                    phone: '555555555'
                }
            }
        };

        it('should not change purchaseUnit since digital goods flow is enabled', () => {
            const originalPurchaseUnit = JSON.parse(JSON.stringify(purchaseUnit));
            const isDigitalGoodsFlowEnabled = true;

            paymentSourcePaypalHelper.addContactInfoToPurchaseUnit( { currentBasket, purchaseUnit, isDigitalGoodsFlowEnabled });

            expect(purchaseUnit).to.deep.equals(originalPurchaseUnit);
        });

        it('should add email address to the purchaseUnit contact info', () => {
            paymentSourcePaypalHelper.addContactInfoToPurchaseUnit({ currentBasket, purchaseUnit });

            expect(purchaseUnit.shipping.email_address).to.equals(currentBasket.customerEmail);
            expect(purchaseUnit.shipping.phone_number).to.be.undefined;
        });

        it('should add phone number and email to the purchaseUnit contact info', () => {
            currentBasket.defaultShipment.shippingAddress.phone = '+1 555 123 4567';
            paymentSourcePaypalHelper.addContactInfoToPurchaseUnit({ currentBasket, purchaseUnit });

            expect(purchaseUnit.shipping.email_address).to.equals(currentBasket.customerEmail);
            expect(purchaseUnit.shipping.phone_number.national_number).to.equals('5551234567');
            expect(purchaseUnit.shipping.phone_number.country_code).to.equals('1');
        });
    });

    describe('getContactPreference', () => {
        const getContactPreference = paymentSourcePaypalHelper.__get__('getContactPreference');
        const shippingData = {};

        let isExpressCheckout = true;
        let isDigitalGoodsEnabled = true;

        afterEach(() => {
            customer.authenticated = false;
            customer.registered = false;
        });

        it('should return NO_CONTACT_INFO if digital goods flow is enabled', () => {
            expect(getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled)).to.equal(constants.CONTACT_PREFERENCE_NO_CONTACT_INFO);
        });

        it('should return RETAIN_CONTACT_INFO if customer is registered and express checkout is used', () => {
            customer.authenticated = true;
            customer.registered = true;
            isExpressCheckout = true;
            isDigitalGoodsEnabled = false;

            expect(getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled)).to.equal(constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO);
        });

        it('should return UPDATE_CONTACT_INFO if customer is guest and express checkout is used', () => {
            expect(getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled)).to.equal(constants.CONTACT_PREFERENCE_UPDATE_CONTACT_INFO);
        });

        it('should return NO_CONTACT_INFO if checkout page and incorrect phone number are used', () => {
            isExpressCheckout = false;

            expect(getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled)).to.equal(constants.CONTACT_PREFERENCE_NO_CONTACT_INFO);
        });

        it('should return RETAIN_CONTACT_INFO if checkout page and correct phone number are used', () => {
            shippingData.phone_number = {};

            expect(getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled)).to.equal(constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO);
        });
    });

    describe('getContactInfo', () => {
        const getContactInfo = paymentSourcePaypalHelper.__get__('getContactInfo');

        const basket = {
            defaultShipment: {
                shippingAddress: {
                    phone: '+1 555 123 4567'
                }
            },
            customerEmail: 'test@basket.com'
        };

        let isExpressCheckout = true;

        before(() => {
            customer.profile = {
                email: 'test@customer.com'
            };
        });

        it('should set phone to null and email from customer if registered customer uses express checkout page', () => {
            customer.authenticated = true;
            customer.registered = true;

            expect(getContactInfo(basket, isExpressCheckout)).to.deep.equals({
                phoneNumber: null,
                email: customer.profile.email
            });
        });

        it('should set phone and email if registered customer uses checkout page', () => {
            isExpressCheckout = false;

            expect(getContactInfo(basket, isExpressCheckout)).to.deep.equals({
                phoneNumber: basket.defaultShipment.shippingAddress.phone,
                email: customer.profile.email
            });
        });

        it('should set phone and email from basket if customer is guest uses checkout page', () => {
            customer.authenticated = false;
            customer.registered = false;
            isExpressCheckout = false;

            expect(getContactInfo(basket, isExpressCheckout)).to.deep.equals({
                phoneNumber: basket.defaultShipment.shippingAddress.phone,
                email: basket.customerEmail
            });
        });
    });

    describe('prepareAppSwitchContext', () => {
        const paymentSource = { paypal: { experience_context: {} } };

        let appSwitchEnabled = false;

        before(() => {
            request.httpReferer = 'https://example.com/en-US/Account-Show';
            request.httpParameterMap = {
                pid: { stringValue: '' },
                currentPage: { stringValue: 'account' }
            };
        });

        after(() => {
            https.reset();
        });

        it('should return from the function if appSwitchEnabled = false', () => {
            expect(paymentSourcePaypalHelper.prepareAppSwitchContext(paymentSource.paypal.experience_context, appSwitchEnabled)).to.be.undefined;
        });

        it('should return a URL for specific httpReferer', () => {
            appSwitchEnabled = true;
            paymentSourcePaypalHelper.prepareAppSwitchContext(paymentSource.paypal.experience_context, appSwitchEnabled);

            expect(paymentSource.paypal.experience_context).to.deep.equal({
                return_url: 'https://example.com/en-US/Account-Show?uaRef=%3D%3DAduV2Zh1iclNXd',
                cancel_url: 'https://example.com/en-US/Account-Show?uaRef=%3D%3DAduV2Zh1iclNXd',
                app_switch_preference: { launch_paypal_app: true }
            });
        });

        it('should return a URL for the cart page', () => {
            appSwitchEnabled = true;
            request.httpParameterMap.currentPage.stringValue = 'minicart';
            paymentSourcePaypalHelper.prepareAppSwitchContext(paymentSource.paypal.experience_context, appSwitchEnabled);

            expect(paymentSource.paypal.experience_context).to.deep.equal({
                return_url: 'https://example.com/en-US/Cart-Show?uaRef=%3D%3DAduV2Zh1iclNXd',
                cancel_url: 'https://example.com/en-US/Cart-Show?uaRef=%3D%3DAduV2Zh1iclNXd',
                app_switch_preference: { launch_paypal_app: true }
            });
        });

        it('should return a URL for the product page with a pid parameter', () => {
            appSwitchEnabled = true;
            request.httpParameterMap.pid.stringValue = 'product-id';
            request.httpParameterMap.currentPage.stringValue = 'home';
            https.withArgs('Product-Show', 'pid', 'product-id').returns({
                toString: () => 'https://example.com/en-US/Product-Show?pid=product-id'
            });
            paymentSourcePaypalHelper.prepareAppSwitchContext(paymentSource.paypal.experience_context, appSwitchEnabled);

            expect(paymentSource.paypal.experience_context).to.deep.equal({
                return_url: 'https://example.com/en-US/Product-Show?pid=product-id&uaRef=%3D%3DAduV2Zh1iclNXd',
                cancel_url: 'https://example.com/en-US/Product-Show?pid=product-id&uaRef=%3D%3DAduV2Zh1iclNXd',
                app_switch_preference: { launch_paypal_app: true }
            });
        });
    });
});
