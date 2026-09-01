const { int_paypal: { paymentPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

const paypalConstants = stub();

Object.setPrototypeOf(module,
    Object.assign(Object.getPrototypeOf(module), {
        superModule: {
            call: () => {}
        }
    }));

const currentBasket = {
    paymentInstruments: [
        {
            paymentMethod: '',
            paymentTransaction: {
                amount: {
                    value: 1
                }
            },
            custom: {
                currentPaypalEmail: 'paypal@gmail.com'
            }
        }
    ]
};

const currentCustomer = {};
const countryCode = {};

const collections = {
    map: (value, func) => {
        value.map(func);
    }
};

const payment = proxyquire(paymentPath, {
    '*/cartridge/scripts/util/collections': collections,
    '*/cartridge/config/constants': paypalConstants,
    'dw/order/PaymentMgr': {
        getPaymentMethod: () => {
            return {
                getName: () => ''
            };
        }
    }
});

describe('payment file', () => {
    describe('Payment function', () => {
        it('if there is no paymentInstruments', () => {
            expect(payment.call({ selectedPaymentInstruments: { paymentInstruments: [] } }, {}, currentCustomer, countryCode)).to.have.been.called;
        });

        it('if there is paymentInstruments without paymentMethod', () => {
            expect(payment.call({ selectedPaymentInstruments: {} }, currentBasket, currentCustomer, countryCode)).to.have.been.called;
        });

        it('if there is paymentInstruments and paymentMethod is GIFT_CERTIFICATE', () => {
            currentBasket.paymentInstruments[0].paymentMethod = 'GIFT_CERTIFICATE';

            expect(payment.call({ selectedPaymentInstruments: {} }, currentBasket, currentCustomer, countryCode)).to.have.been.called;
        });

        it('if there is paymentInstruments and paymentMethod is PayPal', () => {
            currentBasket.paymentInstruments[0].paymentMethod = 'PayPal';

            expect(payment.call({ selectedPaymentInstruments: {} }, currentBasket, currentCustomer, countryCode)).to.have.been.called;
        });

        it('if there is paymentInstruments and paymentMethod is Apple Pay', () => {
            currentBasket.paymentInstruments[0].paymentMethod = 'ApplePay';

            expect(payment.call({ selectedPaymentInstruments: {} }, currentBasket, currentCustomer, countryCode)).to.have.been.called;
        });

        it('if there is paymentInstruments and paymentMethod is PAYPAL_CREDIT_CARD', () => {
            currentBasket.paymentInstruments[0].paymentMethod = 'PAYPAL_CREDIT_CARD';

            expect(payment.call({ selectedPaymentInstruments: {} }, currentBasket, currentCustomer, countryCode)).to.have.been.called;
        });
    });
});
