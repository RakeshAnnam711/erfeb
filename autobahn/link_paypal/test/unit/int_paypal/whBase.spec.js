const { int_paypal: { whBasePath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { it, describe } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const createErrorLog = stub();

const callFake = stub();

const paypalRestService = {
    call: callFake
};

const paypalConstants = {
    ACCESS_TOKEN: 'access_token'
};

const whBase = proxyquire(whBasePath, {
    'dw/web/Resource': dw.web.Resource,
    '*/cartridge/scripts/service/paypalREST': paypalRestService,
    '*/cartridge/config/constants': paypalConstants,
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog
    }
});

describe('whBase file', () => {
    const whBaseModel = new whBase();

    describe('verifyWhSignature', () => {
        const whEvent = {};
        const headers = {
            get: (value) => value
        };

        const webHookId = 'webHookId';

        after(() => {
            callFake.reset();
            callFake.resetBehavior();
        });

        it('if response is not successful', () => {
            callFake.throwsException(new Error('error_description'));

            expect(() => whBaseModel.verifyWhSignature(whEvent, headers, webHookId)).to.throw('error_description');
        });

        it('if response is successful', () => {
            callFake.reset();
            callFake.returns({
                ok: true,
                property: 'value'
            });

            expect(whBaseModel.verifyWhSignature(whEvent, headers, webHookId)).to.be.deep.equal({
                ok: true,
                property: 'value'
            });
        });
    });

    describe('throwVerificationError', () => {
        let msgf;

        const errorMessage = 'The verification status is FAILURE.';

        before(() => {
            msgf = stub(dw.web.Resource, 'msgf');
        });

        after(() => {
            msgf.restore();
        });

        it('if response is not successful', () => {
            const verificationStatus = 'FAILURE';

            msgf.withArgs('paypal.webhook.verified.error', 'paypalerrors', null, verificationStatus).returns(errorMessage);

            expect(() => whBaseModel.throwVerificationError(verificationStatus)).to.throw(errorMessage);
        });
    });
});
