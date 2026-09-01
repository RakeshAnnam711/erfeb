const { bm_paypal: { responseHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const { describe, it } = require('mocha');

require('dw-api-mock/demandware-globals');

const createErrorLogStub = stub();

const responseHelper = require('proxyquire').noCallThru()(responseHelperPath, {
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog: createErrorLogStub
    }
});

describe('responseHelper file', () => {
    describe('handleControllerError', function() {
        let resStub;

        beforeEach(function() {
            resStub = {
                setStatusCode: stub(),
                json: stub()
            };
        });

        it('should set the correct status code and return the error message', function() {
            const error = new Error('Test error');
            const errorCode = 500;

            responseHelper.handleControllerError(error, resStub, errorCode);

            expect(resStub.setStatusCode.calledWith(errorCode)).to.be.true;
            expect(createErrorLogStub.calledOnce).to.be.true;
            expect(resStub.json.calledWith({
                error: true,
                message: 'Test error'
            })).to.be.true;
        });

        it('should handle different types of errors', function() {
            const error = new TypeError('Type error occurred');
            const errorCode = 400;

            responseHelper.handleControllerError(error, resStub, errorCode);

            expect(resStub.setStatusCode.calledWith(errorCode)).to.be.true;
            expect(createErrorLogStub.calledWithMatch(/TypeError/)).to.be.true;
            expect(resStub.json.calledWith({
                error: true,
                message: 'Type error occurred'
            })).to.be.true;
        });
    });
});
