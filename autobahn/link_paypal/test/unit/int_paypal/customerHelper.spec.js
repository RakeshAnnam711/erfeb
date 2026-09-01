/* eslint-disable object-curly-newline */

const { int_paypal: { customerHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const { describe, it, before, after } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const customerHelper = proxyquire(customerHelperPath, {
    'dw/customer/Customer': dw.customer.Customer,
    'dw/object/SystemObjectMgr': dw.object.SystemObjectMgr
});

describe('customerHelper file', () => {
    describe('getCustomerPaymentInstruments', () => {
        let creditCardPaymentInstruments = [{
            creditCardType: 'Visa',
            creditCardHolder: 'John Doe',
            creditCardExpired: false,
            maskedCreditCardNumber: '***********1111',
            creditCardExpirationMonth: '08',
            creditCardExpirationYear: '2023',
            creditCardNumberLastDigits: '1111',
            paymentMethod: 'CREDIT_CARD'
        }, {
            creditCardType: 'Visa',
            creditCardHolder: 'John Doe',
            creditCardExpired: false,
            maskedCreditCardNumber: '***********7777',
            creditCardExpirationMonth: '09',
            creditCardExpirationYear: '2023',
            paymentMethod: 'CREDIT_CARD'
        }];

        before(() => {
            Object.assign(global.customer, {
                authenticated: true,
                profile: {
                    wallet: {
                        getPaymentInstruments: () => ({
                            toArray: () => creditCardPaymentInstruments
                        })
                    }
                }
            });
        });

        after(() => {
            global.customer = new dw.customer.Customer();
        });

        it('should return an array with payment instruments for the payment method name that was passed', () => {
            expect(customerHelper.getCustomerPaymentInstruments('CREDIT_CARD'))
                .to.be.an('array')
                .that.deep.equal(creditCardPaymentInstruments);
        });

        it('should return an empty array if wallet is empty', () => {
            creditCardPaymentInstruments = [];

            expect(customerHelper.getCustomerPaymentInstruments('CREDIT_CARD'))
                .to.be.an('array').that.is.empty;
        });

        it('should return empty array if customer not authenticated', () => {
            global.customer.authenticated = false;

            expect(customerHelper.getCustomerPaymentInstruments('CREDIT_CARD'))
                .to.be.an('array').that.is.empty;
        });
    });

    describe('getPaypalCustomerId', () => {
        const payload = {
            customer: { id: 'pp-customer-id-2' }
        };

        before(() => {
            Object.assign(global.customer, {
                profile: {
                    custom: { payPalCustomerId: 'pp-customer-id' }
                }
            });
        });

        after(() => {
            global.customer = new dw.customer.Customer();
        });

        it('should return paypal customer id from customer profile', () => {
            const result = customerHelper.getPaypalCustomerId(payload);

            expect(result).to.be.a('string');
            expect(result).to.equal('pp-customer-id');
        });

        it('should return paypal customer id from API response', () => {
            global.customer.profile.custom = {};

            const result = customerHelper.getPaypalCustomerId(payload);

            expect(result).to.be.a('string');
            expect(result).to.equal('pp-customer-id-2');
        });
    });

    describe('setPayPalSavedCardsPaymentToken', () => {
        let profileCustom;

        it('should set value to payPalSavedCardsPaymentTokens property if profileCustom.payPalSavedCardsPaymentTokens is empty', () => {
            profileCustom = {};

            expect(customerHelper.setPayPalSavedCardsPaymentToken(profileCustom, 'fewfew')).to.have.been.called;
            expect(profileCustom.payPalSavedCardsPaymentTokens).to.equal('*fewfew*');
        });

        it('should add new value to existent payPalSavedCardsPaymentTokens property if profileCustom.payPalSavedCardsPaymentTokens exists', () => {
            profileCustom = {
                payPalSavedCardsPaymentTokens: '*fewfew*'
            };

            expect(customerHelper.setPayPalSavedCardsPaymentToken(profileCustom, 'fsefergre')).to.have.been.called;
            expect(profileCustom.payPalSavedCardsPaymentTokens).to.equal('*fewfew*fsefergre*');
        });
    });

    describe('deletePayPalSavedCardsPaymentToken', () => {
        let profileCustom;

        it('should delete payPalSavedCardsPaymentTokens property if profileCustom.payPalSavedCardsPaymentTokens has one saved token', () => {
            profileCustom = { payPalSavedCardsPaymentTokens: '*fewfew*' };

            expect(customerHelper.deletePayPalSavedCardsPaymentToken(profileCustom, 'fewfew')).to.have.been.called;
            expect(profileCustom.payPalSavedCardsPaymentTokens).to.equal('*');
        });

        it('should delete payPalSavedCardsPaymentTokens property if profileCustom.payPalSavedCardsPaymentTokens has more than one', () => {
            profileCustom = {
                payPalSavedCardsPaymentTokens: '*fewfew*fsefergre*'
            };

            expect(customerHelper.deletePayPalSavedCardsPaymentToken(profileCustom, 'fsefergre')).to.have.been.called;
            expect(profileCustom.payPalSavedCardsPaymentTokens).to.equal('*fewfew*');
        });
    });

    describe('getCustomerProfile ', () => {
        const customerId = 123456;
        const customer = {
            customerId: customerId
        };

        before(() => {
            stub(dw.object.SystemObjectMgr, 'querySystemObject');
            dw.object.SystemObjectMgr.querySystemObject.withArgs('Profile', 'custom.payPalCustomerId = {0}', customerId).returns(customer);
        });

        after(() => {
            dw.object.SystemObjectMgr.querySystemObject.restore();
        });

        it('should return customer', () => {
            expect(customerHelper.getCustomerProfile(customerId)).to.deep.equal(customer);
        });
    });
});
