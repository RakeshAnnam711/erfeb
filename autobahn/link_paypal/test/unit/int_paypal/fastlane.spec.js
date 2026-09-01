const { int_paypal: { fastlaneHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe, before, after } = require('mocha');
const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

const preferences = {
    isFastlaneEnabled: true,
    isFastlanePaymentUiEnabled: false,
    threeDSecureFlow: 'SCA_WHEN_REQUIRED'
};

const getAmountPaid = stub();

const fastlane = proxyquire(fastlaneHelpersPath, {
    '*/cartridge/config/preferences': preferences,
    '*/cartridge/config/constants': {
        SESSION_CARD: 'sessioncard',
        SCA_ALWAYS: 'SCA_ALWAYS',
        SCA_WHEN_REQUIRED: 'SCA_WHEN_REQUIRED',
        PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD'
    },
    '*/cartridge/scripts/paypal/helpers/paymentHelper': {
        getAmountPaid
    }
});

describe('fastlane', () => {
    describe('isSessionCardSelected', () => {
        const originalRequest = global.request;
        const originalSession = global.session;
        const billingForm = { paypal: { fastlanePaymentToken: { htmlValue: 'payment-token' } } };

        let paymentInstrument = {};

        before(() => {
            global.session = { privacy: { paymentToken: null } };
            global.request = { httpParameterMap: { fastlaneCreditCardList: { stringValue: 'newcard' } } };
        });

        after(() => {
            global.request = originalRequest;
            global.session = originalSession;
        });

        it('should return false when isFastlaneSessionPaymentsEnabled() is false', () => {
            expect(fastlane.isSessionCardSelected(paymentInstrument, billingForm)).to.be.false;
        });

        it('should return false when it is not a session card false', () => {
            preferences.isFastlanePaymentUiEnabled = true;

            expect(fastlane.isSessionCardSelected(paymentInstrument, billingForm)).to.be.false;
        });

        it('should return false when payment token is not match', () => {
            global.request.httpParameterMap.fastlaneCreditCardList.stringValue = 'sessioncard';

            expect(fastlane.isSessionCardSelected(paymentInstrument, billingForm)).to.be.false;
        });

        it('should return true if all sub conditions is true', () => {
            global.session.privacy.paymentToken = 'payment-token';

            expect(fastlane.isSessionCardSelected(paymentInstrument, billingForm)).to.be.true;
        });

        it('should return false when paymentInstrument is null', () => {
            paymentInstrument = null;

            expect(fastlane.isSessionCardSelected(paymentInstrument, billingForm)).to.be.false;
        });
    });

    describe('createThreeDSecureParameters', () => {
        let paymentInstruments = {};

        const currentBasket = {
            getPaymentInstruments: () => {
                return paymentInstruments;
            },
            currencyCode: 'USD'
        };

        afterEach(() => {
            getAmountPaid.reset();
        });

        it('should return empty object if no payment instruments', () => {
            paymentInstruments = { empty: true };

            const result = fastlane.createThreeDSecureParameters(currentBasket);

            expect(result).to.deep.equal({});
        });

        it('should return threeDSecureParameters with amount, currency, and nonce', () => {
            paymentInstruments = [{ custom: { fastlanePaymentToken: 'token123' } }];

            getAmountPaid.returns({ getValue: () => 123.45 });

            const result = fastlane.createThreeDSecureParameters(currentBasket);

            expect(result).to.have.property('amount', '123.45');
            expect(result).to.have.property('currency', 'USD');
            expect(result).to.have.property('nonce', 'token123');
            expect(result).to.not.have.property('threeDSRequested');
        });

        it('should set threeDSRequested to true when SCA_ALWAYS', () => {
            preferences.threeDSecureFlow = 'SCA_ALWAYS';

            paymentInstruments = [{ custom: { fastlanePaymentToken: 'token123' } }];

            getAmountPaid.returns({ getValue: () => 123.45 });

            const result = fastlane.createThreeDSecureParameters(currentBasket);

            expect(result).to.have.property('threeDSRequested', true);
        });
    });
});
