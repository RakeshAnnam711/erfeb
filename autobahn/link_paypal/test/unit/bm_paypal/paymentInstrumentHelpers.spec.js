/* eslint-disable no-underscore-dangle */
const { bm_paypal: { paymentInstrumentHelpersPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { describe, it } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const paymentInstrumentHelpers = proxyquire(paymentInstrumentHelpersPath, {
    'dw/order/PaymentMgr': dw.order.PaymentMgr,
    'dw/system/Transaction': dw.system.Transaction,
    '*/cartridge/models/ppOrderMgr': function() {
        return {
            getOrderData: () => ({
                order: {},
                transactionIdFromOrder: 'transid-000001'
            })
        };
    },
    '*/cartridge/models/ppTransactionMgr': function() {
        return {
            getTransactionData: () => ({})
        };
    },
    '*/cartridge/models/ppTransaction': function() {
        return {
            paymentstatus: 'COMPLETED'
        };
    },
    '~/cartridge/config/constants': {
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
        ALLOWED_PROCESSORS_IDS: ['PAYPAL', 'PAYPAL_LOCAL'],
        PAYMENT_METHODS_MAP: new Map([
            ['GooglePay', 'Google Pay'],
            ['ApplePay', 'Apple Pay'],
            ['PayPal', 'PayPal'],
            ['PAYPAL_CREDIT_CARD', 'Credit Card'],
            ['Venmo', 'Venmo']
        ])
    }
});

describe('paymentInstrumentHelper file', function() {
    before(() => {
        Array.some = function(a, b) {
            return Array.prototype.some.call(a, b);
        };

        Array.filter = function(a, b) {
            return Array.prototype.filter.call(a, b);
        };
    });

    beforeEach(() => {
        stub(dw.order.PaymentMgr, 'getPaymentMethod');
    });

    afterEach(() => {
        dw.order.PaymentMgr.getPaymentMethod.restore();
    });

    describe('getPaypalPaymentInstrument function', function() {
        let basket;

        const paymentInstrumentObject = [{
            paymentMethod: 'PayPal',
            UUID: '49c7ed508ac1dd8182bf3018c9',
            ID: 'PAYPAL'
        }];

        before(() => {
            basket = {
                getPaymentInstruments: stub()
            };

        });

        paymentInstrumentHelpers.__set__('getPaymentMethodsIdWithPaypalProcessor', () => ['PayPal']);

        it('getPaypalPaymentInstrument should return payment instrument object with id PAYPAL', function() {
            basket.getPaymentInstruments.withArgs('PayPal').returns(paymentInstrumentObject);

            expect(paymentInstrumentHelpers.getPaypalPaymentInstrument(basket)).to.deep.equal(paymentInstrumentObject[0]);
        });

        it('getPaypalPaymentInstrument should return null', function() {
            basket.getPaymentInstruments.withArgs('PayPal').returns([]);

            expect(paymentInstrumentHelpers.getPaypalPaymentInstrument(basket)).to.equal(null);
        });
    });

    describe('updatePaypalPaymentInstrument', () => {
        const httpParameterMap = {
            orderNo: { stringValue: '0000001' },
            orderToken: { stringValue: '1q2w3e4r5t6y7u8i9o0p' }
        };

        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());

            paymentInstrumentHelpers.__set__('getPaypalPaymentInstrument', () => ({
                custom: { paypalPaymentStatus: undefined }
            }));
        });

        after(() => {
            dw.system.Transaction.wrap.restore();
            paymentInstrumentHelpers.__ResetDependency__('getPaypalPaymentInstrument');
        });

        it('updates the payment instrument of the order with the payment status of the transaction', () => {
            paymentInstrumentHelpers.updatePaypalPaymentInstrument(httpParameterMap);
            expect(dw.system.Transaction.wrap.calledOnce).to.be.true;
        });
    });

    describe('getPaymentMethodsIdWithPaypalProcessor', () => {
        it('should be an array', () => {
            expect(paymentInstrumentHelpers.getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array');
        });

        it('should be an array that contains PayPal payment method', () => {
            const paymentMethodObject = {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'PayPal',
                name: 'PayPal'
            };

            dw.order.PaymentMgr.getPaymentMethod.returns(paymentMethodObject);

            expect(paymentInstrumentHelpers.getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array').that.include('PayPal');
        });

        it('should be an array that contains ApplePay payment method', () => {
            const paymentMethodObject = {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'ApplePay',
                name: 'ApplePay'
            };

            dw.order.PaymentMgr.getPaymentMethod.returns(paymentMethodObject);

            expect(paymentInstrumentHelpers.getPaymentMethodsIdWithPaypalProcessor()).to.be.an('array').that.include('ApplePay');
        });
    });

    describe('getPaymentMethodId function', () => {
        it('should return payment method name if paymentInstrument.paymentMethod and paymentInstrument.custom.paymentId are equal', () => {
            const paymentMethodObject = {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'PayPal',
                name: 'PayPal'
            };

            const paymentInstrument = {
                paymentMethod: 'PayPal',
                custom: {
                    paymentId: 'PayPal'
                }
            };

            dw.order.PaymentMgr.getPaymentMethod.returns(paymentMethodObject);

            expect(paymentInstrumentHelpers.getPaymentMethodId(paymentInstrument)).to.be.equal('PayPal');
        });

        it('should return payment method name if paymentInstrument.paymentMethod and paymentInstrument.custom.paymentId are NOT equal', () => {
            const paymentMethodObject = {
                paymentProcessor: {
                    ID: 'PAYPAL'
                },
                ID: 'Venmo',
                name: 'Venmo'
            };

            const paymentInstrument = {
                paymentMethod: 'PayPal',
                custom: {
                    paymentId: 'Venmo'
                }
            };

            dw.order.PaymentMgr.getPaymentMethod.returns(paymentMethodObject);

            expect(paymentInstrumentHelpers.getPaymentMethodId(paymentInstrument)).to.be.equal('Venmo');
        });
    });

    describe('getPluginPaymentMethods', function() {
        it('should return only existing payment methods', function() {
            const getPluginPaymentMethods = paymentInstrumentHelpers.__get__('getPluginPaymentMethods');

            dw.order.PaymentMgr.getPaymentMethod.withArgs('GooglePay').returns({ ID: 'GooglePay' });
            dw.order.PaymentMgr.getPaymentMethod.withArgs('ApplePay').returns({ ID: 'ApplePay' });
            dw.order.PaymentMgr.getPaymentMethod.withArgs('PayPal').returns({ ID: 'PayPal' });
            dw.order.PaymentMgr.getPaymentMethod.withArgs('PAYPAL_CREDIT_CARD').returns({ ID: 'PAYPAL_CREDIT_CARD' });
            dw.order.PaymentMgr.getPaymentMethod.withArgs('Venmo').returns({ ID: 'Venmo' });
            dw.order.PaymentMgr.getPaymentMethod.withArgs('INVALID_METHOD').returns(null);

            const result = getPluginPaymentMethods();

            expect(result).to.be.an('array').that.has.lengthOf(5);
            expect(result.map(m => m.ID)).to.include.members(['GooglePay', 'ApplePay', 'PayPal', 'PAYPAL_CREDIT_CARD', 'Venmo']);
        });
    });
});
