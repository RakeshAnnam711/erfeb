const { bm_paypal: { utilsPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const toBase64 = stub();
const errorStub = stub();
const debugStub = stub();

const utils = proxyquire(utilsPath, {
    'dw/util/Bytes': function() {},
    'dw/crypto/Encoding': { toBase64 },
    'dw/system/Logger': {
        getLogger: () => {
            return {
                error: errorStub,
                debug: debugStub
            };
        }
    }
});

describe('utils', () => {
    describe('createErrorLog', () => {
        after(() => {
            errorStub.reset();
            debugStub.reset();
        });

        it('should returns an undefined if message empty', () => {
            utils.createErrorLog();

            expect(debugStub.calledWith('Empty log entry')).to.be.true;
            expect(debugStub.calledOnce).to.be.true;
        });

        it('utils createErrorLog returns undefined', () => {
            utils.createErrorLog('test error');

            expect(errorStub.calledWith('test error')).to.be.true;
            expect(errorStub.calledOnce).to.be.true;
        });
    });

    describe('encodeString', () => {
        after(() => {
            toBase64.reset();
        });

        it('should return encoded string', () => {
            toBase64.returns('base64-string');

            expect(utils.encodeString({})).to.be.a('string');
            expect(toBase64.calledOnce).to.be.true;
        });
    });
});
