'use strict';

const { int_paypal: { paymentSourceHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();
const { stub } = require('sinon');

const isReturningCustomerExperienceEnabled = stub();
const https = stub();
const processCardData = stub();
const processPaypalPaymentSourceData = stub();
const processGooglePayData = stub();

const paymentSource = proxyquire(paymentSourceHelperPath, {
    '~/cartridge/scripts/paypal/helpers/paypalHelper': {
        isReturningCustomerExperienceEnabled: isReturningCustomerExperienceEnabled
    },
    '~/cartridge/config/constants': {
        SHIPPING_PREFERENCE_NO_SHIPPING: 'NO_SHIPPING',
        SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS: 'SET_PROVIDED_ADDRESS',
        SHIPPING_PREFERENCE_GET_FROM_FILE: 'GET_FROM_FILE',
        DWSID: 'dwsid'
    },
    'dw/web/URLUtils': {
        https: https
    },
    '*/cartridge/scripts/paypal/helpers/paymentSourcePaypal': {
        processPaypalPaymentSourceData: processPaypalPaymentSourceData
    },
    '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
        processCardData: processCardData
    },
    '*/cartridge/scripts/paypal/helpers/googlePayHelper': {
        processGooglePayData: processGooglePayData
    }
});

const orderData = {
    body: {
        purchase_units: [{}]
    }
};
const paymentSourceData = {
    paypal: {
        experience_context: {
            brandName: 'test store'
        }
    }
};
const mockVenmoPaymentSource = {
    venmo: {
        experience_context: {
            brandName: 'Store'
        }
    }
};
const lineItemCtnr = {
    UUID: 'UUID'
};

let isExpressCheckout = false;
let isDigitalGoodsEnabled = true;
const isStreamlinedCheckout = true;

describe('paymentSource file', () => {
    const basket = {
        productLineItems: {
            empty: true
        },
        giftCertificateLineItems: {
            empty: false
        }
    };

    const id = '12345';
    const tokenData = {
        name: `dwsecuretoken_${id}`,
        value: 'token'
    };

    const originalRequest = request;

    before(() => {
        request = {
            httpCookies: {
                dwsid: {
                    name: 'dwsid',
                    value: 'session_id'
                }
            }
        };
    });

    after(() => {
        request = originalRequest;
    });

    afterEach(() => {
        isReturningCustomerExperienceEnabled.reset();
    });

    describe('getShippingPreference', () => {
        isExpressCheckout = false;

        it('should return NO SHIPPING preference if product line item is empty and giftCertificateLineItems is not empty', () => {
            expect(paymentSource.getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled));
        });

        it('should return NO SHIPPING preference if digitalGoodsFlow is enabled', () => {
            basket.productLineItems.empty = false;

            expect(paymentSource.getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled));
        });

        it('should return SET_PROVIDED_ADDRESS preference for checkout page', () => {
            isDigitalGoodsEnabled = false;

            expect(paymentSource.getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled));
        });

        it('should return SET_PROVIDED_ADDRESS preference if Return Customer experience button is enabled', () => {
            isReturningCustomerExperienceEnabled.returns(true);

            expect(paymentSource.getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled));
        });

        it('should return GET_FROM_FILE preference for express checkout page', () => {
            isExpressCheckout = true;

            expect(paymentSource.getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled));
        });
    });

    describe('isShippingCallback', () => {
        isDigitalGoodsEnabled = false;
        isExpressCheckout = true;

        before(() => {
            isReturningCustomerExperienceEnabled.returns(false);
        });

        after(() => {
            isReturningCustomerExperienceEnabled.reset();
        });

        it('should return true if express checkout page is used, digital goods and return customer button flows are disabled', () => {
            expect(paymentSource.isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled)).to.be.true;
        });

        it('should return false if express checkout page is used, digital goods is enabled and return customer button is disabled', () => {
            isDigitalGoodsEnabled = true;

            expect(paymentSource.isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled)).to.be.false;
        });

        it('should return false if express checkout page is used, digital goods is disabled and return customer button is enabled', () => {
            isDigitalGoodsEnabled = false;
            isReturningCustomerExperienceEnabled.returns(true);

            expect(paymentSource.isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled)).to.be.false;
        });

        it('should return false if express checkout page is not used', () => {
            isExpressCheckout = false;

            expect(paymentSource.isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled)).to.be.false;
        });
    });

    describe('getDwSecurityToken', () => {
        it('should return undefined if no security token was found', () => {
            expect(paymentSource.getDwSecurityToken()).to.be.undefined;
        });

        it('should return cookie dwsecuretoken ', () => {
            request.httpCookies.dwsecuretoken = tokenData;
            request.httpCookies[`dwanonymous_${id}`] = {
                name: `dwanonymous_${id}`,
                value: tokenData.value
            };

            expect(paymentSource.getDwSecurityToken()).to.be.equals(tokenData);
        });
    });

    describe('getShippingCallbackUrl', () => {
        before(() => {
            request.httpCookies[tokenData.name] = tokenData;
        });

        after(() => {
            https.reset();
        });

        it('should return shipping callback url', () => {
            const basketId = 'test_basket';
            const mockDwSecureTokenData = {
                name: request.httpCookies[tokenData.name].name,
                value: request.httpCookies[tokenData.name].value
            };

            const url = `example.com?cart_id=${basketId}&session_id=${request.httpCookies.dwsid.value}&token_data=${JSON.stringify(mockDwSecureTokenData)}`;

            https.returns({
                toString: () => url,
                append: () => {}
            });

            expect(paymentSource.getShippingCallbackUrl(basketId)).to.deep.equals(url);
        });
    });

    describe('processOrderUpdateCallbackConfig', () => {
        isDigitalGoodsEnabled = false;

        before(() => {
            https.returns({
                toString: () => 'url',
                append: () => {}
            });
        });

        after(() => {
            isReturningCustomerExperienceEnabled.reset();
        });

        it('should not add order_update_callback_config to payment source', () => {
            paymentSource.processOrderUpdateCallbackConfig({
                paymentSourceData,
                isExpressCheckout,
                isDigitalGoodsEnabled,
                lineItemCtnr
            });

            expect(paymentSourceData.paypal.experience_context.order_update_callback_config).to.be.undefined;
        });

        it('should add order_update_callback_config to payment source', () => {
            isExpressCheckout = true;

            isReturningCustomerExperienceEnabled.returns(false);

            paymentSource.processOrderUpdateCallbackConfig({
                paymentSourceData,
                isExpressCheckout,
                isDigitalGoodsEnabled,
                lineItemCtnr
            });

            expect(paymentSourceData.paypal.experience_context.order_update_callback_config).to.deep.equals({
                callback_events: ['SHIPPING_ADDRESS', 'SHIPPING_OPTIONS'],
                callback_url: 'url'
            });
        });
    });

    describe('updatePaymentSourceData', () => {
        const params = {
            lineItemCtnr: lineItemCtnr,
            isExpressCheckout: isExpressCheckout,
            isDigitalGoodsFlowEnabled: isDigitalGoodsEnabled,
            isStreamlinedCheckout: isStreamlinedCheckout
        };

        after(() => {
            processCardData.reset();
        });

        it('should process card data', () => {
            const savedCardPaymentSource = {
                card: {
                    vault_id: 'vault_id',
                    attributes: {}
                }
            };
            const cardSourceData = {
                card: {
                    attributes: {
                        customer: {}
                    },
                    stored_credential: {},
                    vault_id: savedCardPaymentSource.card.vault_id
                }
            };

            processCardData.returns(cardSourceData);

            paymentSource.updatePaymentSourceData(cardSourceData, orderData, params);

            expect(orderData.body.payment_source).to.deep.equals(cardSourceData);
        });

        it('should process Google pay data', () => {
            const googlePayPaymentSource = {
                google_pay: {
                    id: 'id',
                    email_address: 'email'
                }
            };

            processGooglePayData.returns(googlePayPaymentSource);

            paymentSource.updatePaymentSourceData(googlePayPaymentSource, orderData, params);

            expect(orderData.body.payment_source).to.deep.equals(googlePayPaymentSource);
        });

        it('should process PayPal data', () => {
            processPaypalPaymentSourceData.returns(paymentSourceData);

            paymentSource.updatePaymentSourceData(paymentSourceData, orderData, params);

            expect(orderData.body.payment_source).to.deep.equals(paymentSourceData);
        });

        it('should process Venmo data', () => {
            const venmoPaymentSource = {
                venmo: {
                    experience_context: {
                        brandName: 'Store',
                        order_update_callback_config: {},
                        shipping_preference: ''
                    }
                }
            };

            lineItemCtnr.productLineItems = {
                empty: false
            };
            lineItemCtnr.giftCertificateLineItems = {
                empty: true
            };

            processPaypalPaymentSourceData.returns(venmoPaymentSource);

            paymentSource.updatePaymentSourceData(venmoPaymentSource, orderData, params);

            expect(orderData.body.payment_source).to.deep.equals(venmoPaymentSource);
        });
    });

    describe('processVenmoPaymentSourceData', () => {
        const params = {
            paymentSourceData: paymentSourceData,
            isExpressCheckout: true,
            lineItemCtnr: lineItemCtnr,
            isDigitalGoodsFlowEnabled: false
        };
        const originalData = JSON.parse(JSON.stringify(mockVenmoPaymentSource));

        it('should not update Venmo payment source data', () => {
            paymentSource.processVenmoPaymentSourceData(params);

            expect(mockVenmoPaymentSource).to.deep.equals(originalData);
        });

        it('should update Venmo payment source data', () => {
            params.paymentSourceData = mockVenmoPaymentSource;
            paymentSource.processVenmoPaymentSourceData(params);

            expect(mockVenmoPaymentSource.venmo.experience_context.shipping_preference).to.equal('GET_FROM_FILE');
            expect(mockVenmoPaymentSource.venmo.experience_context.order_update_callback_config).to.deep.equals({
                callback_events: ['SHIPPING_ADDRESS', 'SHIPPING_OPTIONS'],
                callback_url: 'url'
            });
        });
    });
});
