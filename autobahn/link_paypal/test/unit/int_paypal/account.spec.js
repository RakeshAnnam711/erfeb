const { int_paypal: { accountPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

Object.setPrototypeOf(module,
    Object.assign(Object.getPrototypeOf(module), { superModule: {} })
);

let ccExpirationNotification = false;

const addExpirationDataForCC = (paymentInstrument) => {
    if (ccExpirationNotification) {
        Object.assign(paymentInstrument, {
            expireNotification: true,
            expireStyle: 'warning',
            expireMessage: 'expire message'
        });
    }
};

const paypalConstants = {
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD'
};

const AccountModel = proxyquire(accountPath, {
    'dw/web/URLUtils': dw.web.URLUtils,
    '*/cartridge/scripts/paypal/helpers/paymentHelper': {
        addExpirationDataForCC
    },
    '*/cartridge/config/constants': paypalConstants
});

describe('account file', () => {
    describe('getCustomerPaymentInstruments function', () => {
        let paymentInstruments = [{
            UUID: 'uuid-1',
            creditCardType: 'Visa',
            creditCardHolder: 'John Doe',
            creditCardExpired: false,
            maskedCreditCardNumber: '***********1111',
            creditCardExpirationMonth: '8',
            creditCardExpirationYear: '2023',
            creditCardNumberLastDigits: '1111',
            paymentId: 'CREDIT_CARD',
            custom: {
                payPalDefaultCard: true
            },
            paymentMethod: 'PAYPAL_CREDIT_CARD'
        }, {
            UUID: 'uuid-2',
            creditCardType: 'Visa',
            creditCardHolder: 'John Doe',
            creditCardExpired: false,
            maskedCreditCardNumber: '***********7777',
            creditCardExpirationMonth: '9',
            creditCardExpirationYear: '2023',
            creditCardNumberLastDigits: '7777',
            paymentId: 'CREDIT_CARD',
            custom: undefined,
            paymentMethod: 'PAYPAL_CREDIT_CARD'
        }];

        const result = [{
            creditCardHolder: 'John Doe',
            maskedCreditCardNumber: '***********1111',
            creditCardType: 'Visa',
            creditCardExpirationMonth: '08',
            creditCardExpirationYear: '2023',
            UUID: 'uuid-1',
            creditCardExpired: false,
            creditCardNumberLastDigits: '1111',
            creditCardExpirationYearShort: '23',
            isDefault: true,
            cardTypeImage: {
                src: '/on/demandware.static/relative/url/to/resource',
                alt: 'Visa'
            }
        }, {
            creditCardHolder: 'John Doe',
            maskedCreditCardNumber: '***********7777',
            creditCardType: 'Visa',
            creditCardExpirationMonth: '09',
            creditCardExpirationYear: '2023',
            UUID: 'uuid-2',
            creditCardExpired: false,
            creditCardNumberLastDigits: '7777',
            creditCardExpirationYearShort: '23',
            isDefault: false,
            cardTypeImage: {
                src: '/on/demandware.static/relative/url/to/resource',
                alt: 'Visa'
            }
        }];

        it('should return an array of objects if paymentInstrubments not empty', () => {
            expect(AccountModel.getCustomerPaymentInstruments).to.be.a('function');

            expect(AccountModel.getCustomerPaymentInstruments(paymentInstruments))
                .to.be.an('array')
                .that.have.lengthOf(2)
                .that.deep.equal(result);
        });

        it('should return an array of objects if paymentInstrubments not empty. Should present Credit Card expiration properties', () => {
            ccExpirationNotification = true;

            const result2 = JSON.parse(JSON.stringify(result));

            result2.map((item) => {
                item.expireNotification = true;
                item.expireStyle = 'warning';
                item.expireMessage = 'expire message';

                return item;
            });

            expect(AccountModel.getCustomerPaymentInstruments(paymentInstruments))
                .to.be.an('array')
                .that.have.lengthOf(2)
                .that.deep.equal(result2);
        });

        it('should return empty object if paymentInstrubments is empty', () => {
            paymentInstruments = [];

            expect(AccountModel.getCustomerPaymentInstruments(paymentInstruments)).to.be.an('array').that.is.empty;
        });
    });
});
