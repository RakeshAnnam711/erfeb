const { int_paypal: { checkoutHelpersPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { describe, it, beforeEach, before, after } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

const validateFields = stub();
const failOrder = stub();
const getPaymentMethod = stub();
const hasHook = stub();
const callHook = stub();
const ensureValidShipments = stub();
const copyBillingAddressToBasket = stub();

Object.setPrototypeOf(module,
    Object.assign(Object.getPrototypeOf(module), {
        superModule: {
            validateFields: validateFields,
            ensureValidShipments: ensureValidShipments,
            copyBillingAddressToBasket: copyBillingAddressToBasket
        }
    })
);

const paypalPreferences = {};
const checkoutHelpers = proxyquire(checkoutHelpersPath, {
    'dw/order/OrderMgr': {
        failOrder: failOrder
    },
    'dw/order/PaymentMgr': {
        getPaymentMethod: getPaymentMethod
    },
    'dw/system/HookMgr': {
        hasHook: hasHook,
        callHook: callHook
    },
    '*/cartridge/config/preferences': paypalPreferences
});

describe('checkoutHelpers file', () => {
    describe('validateShippingForm', () => {
        before(() => {
            validateFields.returns('{testNoError}');
        });

        it('should be a function', () => {
            expect(checkoutHelpers.validateShippingForm).to.be.a('function');
        });

        it('should returns an empty object', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = true;
            expect(checkoutHelpers.validateShippingForm()).to.be.an('object').that.is.empty;
        });

        it('should returns an not empty object', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = false;
            expect(checkoutHelpers.validateShippingForm()).to.be.not.undefined;
        });
    });

    describe('copyBillingAddressToBasket', () => {
        let address = {};
        let currentBasket = {};

        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        beforeEach(() => {
            copyBillingAddressToBasket.resetHistory();
            currentBasket = { billingAddress: null };
            address = {
                firstName: 'John',
                lastName: 'Doe',
                countryCode: {
                    value: 'CO'
                },
                address1: 'testAddress1',
                address2: 'testAddress2',
                city: 'testCity',
                postalCode: 'testPostalCode',
                stateCode: 'testStateCode',
                phone: 'testPhone'
            };

            paypalPreferences.isDigitalGoodsFlowEnabled = false;
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
        });

        it('should return undefined if address.address1 is null', () => {
            address.address1 = null;

            expect(checkoutHelpers.copyBillingAddressToBasket(address, currentBasket)).to.be.undefined;
            expect(copyBillingAddressToBasket.calledOnce).to.be.false;
        });

        it('should call original copyBillingAddressToBasket function from the super module', () => {
            address.address1 = 'testAddress1';

            checkoutHelpers.copyBillingAddressToBasket(address, currentBasket);

            expect(copyBillingAddressToBasket.calledOnce).to.be.true;
        });

        it('should returns an undefined', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = true;
            currentBasket.billingAddress = null;
            address.address1 = '';

            expect(checkoutHelpers.copyBillingAddressToBasket(address, currentBasket)).to.be.undefined;
            expect(copyBillingAddressToBasket.calledOnce).to.be.false;
        });
    });

    describe('handlePayments', () => {
        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
        });

        afterEach(() => {
            failOrder.reset();
            getPaymentMethod.reset();
            hasHook.reset();
            callHook.reset();
        });

        it('should return an empty object if order totalNetPrice is 0.00', () => {
            const order = {
                totalNetPrice: 0.00,
                paymentInstruments: {
                    toArray: () => []
                }
            };

            const result = checkoutHelpers.handlePayments(order, '12345');

            expect(result).to.deep.equal({});
        });

        it('should fail the order if there are no payment instruments', () => {
            const order = {
                totalNetPrice: 100.00,
                paymentInstruments: {
                    toArray: () => []
                }
            };

            const result = checkoutHelpers.handlePayments(order, '12345');

            expect(result.error).to.be.true;
            expect(failOrder.calledOnce).to.be.true;
        });

        it('should set transaction ID if payment processor is null', () => {
            const setTransactionID = stub();

            const order = {
                totalNetPrice: 100.00,
                paymentInstruments: {
                    toArray: () => [{
                        paymentMethod: 'PayPal',
                        paymentTransaction: {
                            setTransactionID: setTransactionID
                        }
                    }]
                }
            };

            getPaymentMethod.returns({
                paymentProcessor: null
            });

            const result = checkoutHelpers.handlePayments(order, '12345');

            expect(result).to.be.deep.equal({});
            expect(setTransactionID.calledOnce).to.be.true;
        });

        it('should return an error object if authorize hook do not finished successfully', () => {
            const order = {
                totalNetPrice: 100.00,
                paymentInstruments: {
                    toArray: () => [{
                        paymentMethod: 'PayPal',
                        paymentTransaction: {}
                    }]
                }
            };

            getPaymentMethod.returns({
                paymentProcessor: {
                    ID: 'PAYPAL'
                }
            });

            hasHook.returns(false);
            callHook.returns({
                error: true,
                errorMessage: 'error message'
            });

            const result = checkoutHelpers.handlePayments(order, '12345');

            expect(result).to.be.deep.equal({
                error: true,
                errorMessage: 'error message'
            });
            expect(failOrder.calledOnce).to.be.true;
        });

        it('should return an empty object if authorize hook finished successfully', () => {
            const order = {
                totalNetPrice: 100.00,
                paymentInstruments: {
                    toArray: () => [{
                        paymentMethod: 'PayPal',
                        paymentTransaction: {}
                    }]
                }
            };

            getPaymentMethod.returns({
                paymentProcessor: {
                    ID: 'PAYPAL'
                }
            });

            hasHook.returns(true);
            callHook.returns({});

            const result = checkoutHelpers.handlePayments(order, '12345');

            expect(result).to.be.deep.equal({});
        });
    });

    describe('ensureValidShipments', () => {
        const lineItemContainer = {};

        before(() => {
            ensureValidShipments.returns(true);
        });

        after(() => {
            ensureValidShipments.reset();
        });

        it('should return true if isDigitalGoodsFlowEnabled = Yes', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = true;

            expect(checkoutHelpers.ensureValidShipments(lineItemContainer)).to.be.true;
        });

        it('should call original ensureValidShipments function from base', () => {
            paypalPreferences.isDigitalGoodsFlowEnabled = false;

            expect(checkoutHelpers.ensureValidShipments(lineItemContainer)).to.be.a('boolean');
            expect(ensureValidShipments.calledOnce).to.be.true;
        });
    });
});
