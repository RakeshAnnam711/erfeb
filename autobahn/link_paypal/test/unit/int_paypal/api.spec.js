const { int_paypal: { apiPath } } = require('../path.json');

const { expect } = require('chai');
const {
    it, describe, beforeEach, after
} = require('mocha');

const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const partnerAttributionId = stub();
const createErrorLog = stub();
const createErrorMsg = stub();
const updatePaymentSourceData = stub();

const paypalPaymentSource = {
    paypal: {
        experience_context: {
            brand_name: 'Store'
        },
        email_address: 'test@g.com'
    }
};

const paymentInstrument = {
    paymentTransaction: {
        amount: {
            value: null
        },
        setAmount: () => {}
    },
    custom: {
        paypalOrderID: null,
        currentPaypalEmail: null,
        paymentId: null
    }
};

const purchaseUnit = {
    amount: {
        value: null
    },
    shipping: {}
};

const bodyObj = {};

const response = {
    id: null,
    ok: null,
    token_id: null,
    state: null,
    payer: {
        payer_info: null,
        email_address: null
    },
    purchase_units: null,
    shipping_address: null,
    emails: null,
    name: null,
    address: null
};

const paypalRestService = {
    call: () => response
};

const paypalPreferences = {
    isCapture: true,
    partnerAttributionId,
    threeDSecureFlow: true,
    isDigitalGoodsFlowEnabled: true
};

const savedCardPaymentSource = {
    card: {
        vault_id: 'vault_id',
        attributes: {}
    }
};

function makeResponseDefault() {
    response.id = null;
    response.state = null;
    response.token_id = null;
    response.payer.email_address = null;
    response.purchase_units = null;
    response.payer.payer_info = null;
    response.shipping_address = null;
}

const api = proxyquire(apiPath, {
    'dw/system/Transaction': dw.system.Transaction,
    'dw/value/Money': dw.value.Money,
    'dw/web/Resource': {
        msg: () => {}
    },
    '*/cartridge/scripts/service/paypalREST': paypalRestService,
    '*/cartridge/config/preferences': paypalPreferences,
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog,
        createErrorMsg
    },
    '*/cartridge/config/constants': {
        ACCESS_TOKEN: 'ACCESS_TOKEN',
        REGEXP_PHONE: /^[0-9]{1,14}?$/,
        REGEXP_EMAIL: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
        METHOD_GET: 'GET',
        METHOD_POST: 'POST',
        INTENT_CAPTURE: 'CAPTURE',
        INTENT_AUTHORIZE: 'AUTHORIZE'
    },
    'dw/util/UUIDUtils': {
        createUUID: () => 'uuid'
    },
    '*/cartridge/scripts/paypal/helpers/creditCardHelper': {
        getCustomerData: () => ({}),
        processCardData: () =>({
            card: {
                attributes: {
                    customer: {}
                },
                stored_credential: {},
                vault_id: savedCardPaymentSource.card.vault_id
            }
        })
    },
    '*/cartridge/scripts/paypal/helpers/googlePayHelper': {
        processGooglePayData: () => ({
            google_pay: {
                email_address: 'email',
                id: 'id'
            }
        })
    },
    '*/cartridge/config/sdkConfig': {
        disableFunds: ['sepa', 'bancontact', 'eps', 'ideal', 'mybank', 'p24', 'blik', 'trustly', 'multibanco']
    },
    '*/cartridge/scripts/paypal/helpers/paymentSource': {
        updatePaymentSourceData: updatePaymentSourceData
    }
});

describe('api file', () => {
    describe('getOrderDetails', () => {
        before(() => {
            request = {
                httpParameterMap: {}
            };
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        beforeEach(() => {
            paymentInstrument.custom.paypalOrderID = 'orderID';
        });

        after(() => {
            paypalRestService.call = () => response;
            paymentInstrument.custom.paypalOrderID = null;
            makeResponseDefault();
            dw.system.Transaction.wrap.restore();
        });

        it('if paymentInstrument has not paypalOrderID', () => {
            paymentInstrument.custom.paypalOrderID = null;
            createErrorMsg.returns('paypal.error.api.order.id.notfound');

            expect(api.getOrderDetails(paymentInstrument)).to.be.deep.equal({
                err: 'paypal.error.api.order.id.notfound'
            });
        });

        it('if paymentInstrument has paypalOrderID and service responsed', () => {
            response.payer.email_address = 'test@gmail.com';
            response.payer.payer_info = 'payer_info';
            response.purchase_units = 'purchase_units';
            response.payment_source = 'payment_source';

            expect(api.getOrderDetails(paymentInstrument)).to.be.deep.equal({
                payer: {
                    email_address: response.payer.email_address,
                    payer_info: response.payer.payer_info
                },
                purchase_units: response.purchase_units,
                payment_source: response.payment_source
            });
        });

        it('if paymentInstrument has paypalOrderID and service respons failed', () => {
            createErrorMsg.returns('No payer info was found. Order ID ');
            paypalRestService.call = () => null;

            expect(api.getOrderDetails(paymentInstrument)).to.be.deep.equal({
                err: 'No payer info was found. Order ID '
            });
        });

        it('if paymentInstrument paymentId === PAYPAL_CREDIT_CARD', () => {
            paymentInstrument.custom.paymentId = 'PAYPAL_CREDIT_CARD';

            response.purchase_units = 'purchase_units';
            response.payment_source = 'payment_source';

            paypalRestService.call = () => response;

            expect(api.getOrderDetails(paymentInstrument)).to.be.deep.equal({
                payment_source: response.payment_source,
                purchase_units: response.purchase_units
            });
        });
    });

    describe('generateClientToken', () => {
        before(() => {
            paypalRestService.call = () => ({
                ok: true,
                client_token: 'client_token'
            });

            request.locale = 'US';
        });

        after(() => {
            paypalRestService.call = () => response;
            request.locale = null;
        });

        it('if client token is generated', () => {
            expect(api.generateClientToken()).to.be.equal('client_token');
        });

        it('if unexpected response', () => {
            paypalRestService.call = () => {
                throw new Error('paypal.error.api');
            };

            createErrorMsg.returns('paypal.error.api');

            expect(api.generateClientToken()).to.be.deep.equal({
                err: 'paypal.error.api'
            });
        });
    });

    describe('updateOrderDetails', () => {
        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        beforeEach(() => {
            paymentInstrument.custom.paypalOrderID = 'orderID';
        });

        after(() => {
            paymentInstrument.custom.paypalOrderID = null;
            paymentInstrument.paymentTransaction.amount.value = null;
            purchaseUnit.amount.value = null;
            dw.system.Transaction.wrap.restore();
        });

        it('if paymentInstrument has not paypalOrderID', () => {
            createErrorMsg.returns('paypal.error.api.order.id.notfound');
            paymentInstrument.custom.paypalOrderID = null;

            expect(api.updateOrderDetails(paymentInstrument, purchaseUnit)).to.be.deep.equal({
                err: 'paypal.error.api.order.id.notfound'
            });
        });

        it('if paymentInstrument has paypalOrderID and service responsed and amount values are the same', () => {
            paymentInstrument.paymentTransaction.amount.value = 5;
            purchaseUnit.amount.value = 5;

            expect(api.updateOrderDetails(paymentInstrument, purchaseUnit)).to.be.deep.equal({
                isOkUpdate: true
            });
        });

        it('if paymentInstrument has paypalOrderID and service responsed and amount values are different', () => {
            paymentInstrument.paymentTransaction.amount.value = 5;
            purchaseUnit.amount.value = 6;

            expect(api.updateOrderDetails(paymentInstrument, purchaseUnit)).to.be.deep.equal({
                isOkUpdate: true
            });
        });
    });

    describe('createTransaction', () => {
        beforeEach(() => {
            paymentInstrument.custom.paypalOrderID = 'orderID';
            response.id = 1;
            response.state = 'ACTIVE';
            response.token_id = 'token_id';
            response.payer.email_address = 'test@gmail.com';
            response.payer.payer_info = 'payer_info';
            response.purchase_units = 'purchase_units';
            response.shipping_address = 'Test Address';
        });

        after(() => {
            paymentInstrument.custom.paypalOrderID = null;
            paypalPreferences.isCapture = true;
            makeResponseDefault();
        });

        it('if paymentInstrument has not paypalOrderID', () => {
            createErrorMsg.returns('paypal.error.api.order.id.notfound');
            paymentInstrument.custom.paypalOrderID = null;

            expect(api.createTransaction(paymentInstrument, bodyObj)).to.be.deep.equal({
                err: 'paypal.error.api.order.id.notfound'
            });
        });

        it('if paymentInstrument has paypalOrderID and isCapture is true', () => {
            expect(api.createTransaction(paymentInstrument, bodyObj)).to.be.deep.equal({
                response: response
            });
        });

        it('if paymentInstrument has paypalOrderID and isCapture is false', () => {
            paypalPreferences.isCapture = false;

            expect(api.createTransaction(paymentInstrument, bodyObj)).to.be.deep.equal({
                response: response
            });
        });

        it('if paymentInstrument has paypalOrderID, but it is without bodyObj', () => {
            expect(api.createTransaction(paymentInstrument)).to.be.deep.equal({
                response: response
            });
        });
    });

    describe('createOrder', () => {
        const body = {
            intent: 'CAPTURE',
            processing_instruction: undefined,
            purchase_units: [purchaseUnit]
        };

        beforeEach(() => {
            updatePaymentSourceData.returns({});
            paypalRestService.call = () => response;
            paypalPreferences.isCapture = true;
            response.id = 1;
            response.state = 'ACTIVE';
            response.token_id = 'token_id';
            response.payer.email_address = 'test@gmail.com';
            response.purchase_units = 'purchase_units';

            request.httpParameterMap.isLocalPaymentMethod = { booleanValue: false };
        });

        after(() => {
            makeResponseDefault();

            delete request.httpParameterMap.isLocalPaymentMethod;
        });

        afterEach(() => {
            updatePaymentSourceData.reset();
        });

        it('if there is no purchaseUnit', () => {
            createErrorMsg.returns('No purchaseUnit was found');

            expect(api.createOrder()).to.be.deep.equal({
                err: 'No purchaseUnit was found'
            });
        });

        it('if there is purchaseUnit, response and isCapture is true', () => {
            expect(api.createOrder({ purchaseUnit })).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
        });

        it('if there is purchaseUnit, response and isCapture is false', () => {
            paypalPreferences.isCapture = false;
            body.intent = 'AUTHORIZE';

            expect(api.createOrder({ purchaseUnit })).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
        });

        const lineItemCtnr = {
            billingAddress: {
                phone: '01123456789',
                countryCode: {
                    value: 'US'
                },
                customerEmail: 'test@test.com',
                address1: 'address1',
                address2: 'address2',
                city: 'city',
                stateCode: 'stateCode',
                postalCode: 'postalCode'
            }
        };

        it('if there is purchaseUnit and lineItemCtnr.billingAddress', () => {
            body.intent = 'CAPTURE';

            expect(api.createOrder({ purchaseUnit, lineItemCtnr })).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
        });

        const newCardPaymentSource = {
            card: {
                attributes: {},
                name: 'test',
                billing_address: {}
            }
        };

        it('if card paymentSourceData is passed as argument during the new card flow', () => {
            expect(api.createOrder({ purchaseUnit, lineItemCtnr }, newCardPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });

            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });

        it('if card paymentSourceData is passed as argument during the saved card flow', () => {

            expect(api.createOrder({ purchaseUnit, lineItemCtnr }, savedCardPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });

        it('if Apple pay paymentSourceData is passed', () => {
            const applePayPaymentSource = {
                apple_pay: {
                    id: 'id',
                    email_address: 'email'
                }
            };

            expect(api.createOrder({ purchaseUnit, lineItemCtnr }, applePayPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });

        it('if Paypal paymentSourceData without phone number is passed and checkout page is used', () => {
            const isExpressCheckout = false;

            expect(api.createOrder({ purchaseUnit, lineItemCtnr, isExpressCheckout }, paypalPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });

        it('if Paypal paymentSourceData is passed and express checkout page is used', () => {
            const isExpressCheckout = true;

            expect(api.createOrder({ purchaseUnit, lineItemCtnr, isExpressCheckout }, paypalPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });

        it('if Google Pay payment source is passed', () => {
            const googlePayPaymentSource = {
                google_pay: {
                    id: 'id',
                    email_address: 'email'
                }
            };

            expect(api.createOrder({ purchaseUnit, lineItemCtnr }, googlePayPaymentSource)).to.be.deep.equal({
                resp: response,
                requestBody: body
            });
            expect(updatePaymentSourceData.calledOnce).to.be.true;
        });
    });

    describe('exchangeAuthCodeForAccessToken', () => {
        before(() => {
            paypalRestService.call = () => ({
                ok: true,
                access_token: 'access_token'
            });
        });

        after(() => {
            paypalRestService.call = () => response;
        });

        it('if result is OK', () => {
            expect(api.exchangeAuthCodeForAccessToken()).to.be.equal('access_token');
        });

        it('if result is not OK', () => {
            paypalRestService.call = () => {
                throw new Error('response error');
            };

            expect(() => api.exchangeAuthCodeForAccessToken()).to.throw('response error');
        });
    });

    describe('generateSdkClientToken', () => {
        before(() => {
            paypalRestService.call = () => ({
                ok: true,
                access_token: 'access_token'
            });
        });

        after(() => {
            paypalRestService.call = () => response;
        });

        it('if result is OK', () => {
            expect(api.generateSdkClientToken()).to.be.equal('access_token');
        });

        it('if result is not OK', () => {
            paypalRestService.call = () => {
                throw new Error('response error');
            };

            expect(() => api.generateSdkClientToken()).to.throw('response error');
        });
    });

    describe('getPaypalCustomerInfo', () => {
        after(() => {
            paypalRestService.call = () => response;

            response.email = null;
            response.name = null;
            response.address = null;
        });

        it('if result is OK', () => {
            response.email = 'test@test.com';
            response.email_verified = true;
            response.name = 'TestName';
            response.address = 'TestAddress';
            response.ok = true;

            paypalRestService.call = () => response;

            expect(api.getPaypalCustomerInfo('accessToken')).to.be.deep.equal(response);
        });

        it('if result is not OK', () => {
            paypalRestService.call = () => ({
                ok: false
            });

            expect(api.getPaypalCustomerInfo('accessToken')).to.be.null;
        });
    });

    describe('createBillingAddressObject', () => {
        const createBillingAddressObject = api.__get__('createBillingAddressObject');

        it('properly formatted billing address should be returned', () => {
            const billingAddress = {
                address1: 'address1',
                city: 'city',
                stateCode: 'stateCode',
                postalCode: 'postalCode',
                countryCode: { value: 'countryCode' }
            };

            const result = createBillingAddressObject(billingAddress);

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                address_line_1: 'address1',
                address_line_2: '',
                admin_area_2: 'city',
                admin_area_1: 'stateCode',
                postal_code: 'postalCode',
                country_code: 'countryCode'
            });
        });
    });

    describe('createSetupToken', () => {
        const originalCustomer = customer;

        before(() => {
            customer = {
                profile: {
                    custom: { payPalCustomerId: 'pp-id' }
                }
            };
            paypalRestService.call = ({ body: { payment_source } }) => {
                return {
                    id: 'setup-token',
                    payment_source: payment_source,
                    customer: { id: 'pp-customer-id' }
                };
            };

            createErrorMsg.withArgs('Test error').returns('An internal server error occurred.');
        });

        after(() => {
            customer = originalCustomer;
            paypalRestService.call = () => response;
            createErrorMsg.reset();
        });

        it('if customer have saved paypal customer id, and service result is successfully returned', () => {
            const result = api.createSetupToken({});

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                id: 'setup-token',
                payment_source: undefined,
                customer: { id: 'pp-customer-id' }
            });
        });

        it('if customer does not have saved paypal customer id, and service call throws an error', () => {
            customer.profile.custom = {};
            paypalRestService.call = () => {
                throw new Error('Test error');
            };

            const result = api.createSetupToken({});

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                err: 'An internal server error occurred.'
            });
        });
    });

    describe('createPaymentToken', () => {
        before(() => {
            paypalRestService.call = ({ body: { payment_source, customer } }) => {
                return {
                    id: 'payment-token',
                    payment_source: payment_source,
                    customer: customer
                };
            };

            createErrorMsg.withArgs('Test error').returns('An internal server error occurred.');
        });

        after(() => {
            paypalRestService.call = () => response;
            createErrorMsg.reset();
        });

        it('if service result is successfully returned', () => {
            const result = api.createPaymentToken('token1', 'SETUP_TOKEN', 'pp-customer-1');

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                id: 'payment-token',
                payment_source: {
                    token: {
                        id: 'token1',
                        type: 'SETUP_TOKEN'
                    }
                },
                customer: {
                    id: 'pp-customer-1'
                }
            });
        });

        it('if service call throws an error, the object with error msg should be returned', () => {
            paypalRestService.call = () => {
                throw new Error('Test error');
            };

            const result = api.createPaymentToken('token2', 'SETUP_TOKEN', 'pp-customer-2');

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                err: 'An internal server error occurred.'
            });
        });
    });

    describe('deletePaymentToken', () => {
        before(() => {
            paypalRestService.call = () => {
                return {
                    statusCode: 204
                };
            };

            createErrorMsg.withArgs('Test error').returns('An internal server error occurred.');
        });

        after(() => {
            paypalRestService.call = () => response;
            createErrorMsg.reset();
        });

        it('if service result was successfully returned', () => {
            const result = api.deletePaymentToken('token');

            expect(result).to.be.an('object');
            expect(result.statusCode).to.equal(204);
        });

        it('if service call throws an error, the object with error msg should be returned', () => {
            paypalRestService.call = () => {
                throw new Error('Test error');
            };

            const result = api.deletePaymentToken('token');

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({
                err: 'An internal server error occurred.'
            });
        });
    });

    describe('generateUserIdToken', () => {
        const originalCustomer = global.customer;

        before(() => {
            paypalRestService.call = ({ userIdToken, payPalCustomerId }) => {
                if (userIdToken && payPalCustomerId) {
                    return { id_token: 'generated-id-token' };
                }

                throw new Error('paypal.error.api');
            };

            createErrorMsg.withArgs('paypal.error.api').returns('An internal server error occurred.');
        });

        after(() => {
            paypalRestService.call = () => response;
            createErrorMsg.reset();
            global.customer = originalCustomer;
        });

        it('should return a user-id-token if service call is successful', () => {
            global.customer = {
                profile: {
                    custom: {
                        payPalCustomerId: 'pp-id'
                    }
                }
            };

            const result = api.generateUserIdToken();

            expect(result).to.be.equal('generated-id-token');
        });

        it('should return an error message if service call throws an error', () => {
            global.customer = {
                profile: {
                    custom: {}
                }
            };

            const result = api.generateUserIdToken();

            expect(result).to.deep.equal({
                err: 'An internal server error occurred.'
            });
        });
    });
});
