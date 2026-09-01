const { int_paypal: { postAuthorizationHandlingPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const getPaypalPaymentInstrument = stub();
const createErrorLog = stub();

require('dw-api-mock/demandware-globals');

const postAuthorizationHandling = proxyquire(postAuthorizationHandlingPath, {
    '*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper': {
        getPaypalPaymentInstrument: getPaypalPaymentInstrument
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog: createErrorLog
    }
});

describe('postAuthorizationHandling file', () => {
    describe('postAuthorizationHandling file', () => {
        it('postAuthorizationHandling should have property postAuthorization', () => {
            expect(postAuthorizationHandling).has.ownProperty('postAuthorization');
        });

        it('property postAuthorization is function', () => {
            expect(postAuthorizationHandling.postAuthorization).to.be.a('function');
        });
    });

    describe('postAuthorization function', () => {
        it('should return empty object if result.error is false', () => {
            const result = { error: false };
            const response = postAuthorizationHandling.postAuthorization(result);

            expect(response).to.be.empty;
        });

        it('should call createErrorLog if result.serverErrors is truthy', () => {
            const result = { error: true, serverErrors: ['error'] };

            postAuthorizationHandling.postAuthorization(result);

            expect(createErrorLog.called).to.be.true;
        });

        it('should return object with error and errorMessage properties', () => {
            const result = { error: true, message: 'error' };
            const response = postAuthorizationHandling.postAuthorization(result);

            expect(response).to.have.property('error', true);
            expect(response).to.have.property('errorMessage');
        });
    });
});
