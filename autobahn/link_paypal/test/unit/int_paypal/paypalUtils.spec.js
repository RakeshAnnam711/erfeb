/* eslint-disable no-underscore-dangle */
const { int_paypal: { utilsPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const get = stub();
const toBase64 = stub();
const error = stub();
const debug = stub();
const restService = { configuration: { credential: { user: 'g12346F' } } };
const disableFunds = ['sepa', 'bancontact', 'eps', 'ideal', 'mybank', 'p24'];

const paypalConstants = {
    PAYPAL_FILE_NAME_PREFIX: 'PayPal',
    PAYPAL_CATEGORY: 'PayPal_General'
};

const utils = proxyquire(utilsPath, {
    'dw/svc/LocalServiceRegistry': {
        createService: () => {
            return restService;
        }
    },
    '*/cartridge/config/sdkConfig': {
        disableFunds,
        allowedCurrencies: []
    },
    'server': {
        forms: {
            getForm: () => {}
        }
    },
    'dw/util/Bytes': () => { },
    'dw/crypto/Encoding': { toBase64 },
    'dw/system/Logger': {
        getLogger: () => ({
            debug,
            error
        })
    },
    'dw/web/Resource': dw.web.Resource,
    'dw/util/StringUtils': {
        decodeBase64: (str) => Buffer.from(str, 'base64').toString('utf8')
    },
    '*/cartridge/config/constants': paypalConstants
});

describe('utils file', () => {
    describe('getClientId', () => {
        const getClientId = utils.__get__('getClientId');

        describe('if client id exists in cash', () => {
            before(() => {
                get.returns('g12345D');
            });

            after(() => {
                get.reset();
            });

            it('should return client id from cash', () => {
                expect(getClientId()).to.be.equals('g12346F');
            });
        });

        describe('if client doesn`t exist in cash', () => {
            before(() => {
                get.returns(null);
            });

            after(() => {
                get.reset();
            });

            it('should create client id, save it in cash and return from cash', () => {
                expect(getClientId()).to.be.equals('g12346F');
            });
        });
    });

    describe('encodeString', () => {
        const encodeString = utils.__get__('encodeString');
        const purchaseUnit = {};

        after(() => {
            toBase64.reset();
        });

        it('should return encoded string', () => {
            encodeString(purchaseUnit);

            expect(toBase64.calledOnce).to.be.true;
        });
    });

    describe('createErrorLog', () => {
        const err = {
            stack: 'stack',
            message: 'error-message'
        };

        afterEach(() => {
            error.reset();
            debug.reset();
        });

        it('If error log with error message and error stack was created', () => {
            utils.createErrorLog(err);

            expect(error.calledWith('error-messagestack')).to.be.true;
        });

        it('If error log was created', () => {
            utils.createErrorLog('error');

            expect(error.calledWith('error')).to.be.true;
        });

        it('If debug log was created', () => {
            utils.createErrorLog();

            expect(debug.calledOnce).to.be.true;
        });
    });

    describe('createDebugLog', () => {
        const err = 'Error';

        before(() => {
            utils.__set__('paypalLogger', undefined);
        });

        it('should create debug log', () => {
            utils.createDebugLog(err);

            expect(debug.calledWith('Error')).to.be.true;
        });
    });

    describe('createErrorMsg', () => {
        before(() => {
            stub(dw.web.Resource, 'msg');
            dw.web.Resource.msg.withArgs('paypal.error.general', 'paypalerrors', null).returns('pp.error');
            dw.web.Resource.msg.withArgs('paypal.error.customerror', 'paypalerrors', 'pp.error').returns('custom error message');
        });

        after(() => {
            dw.web.Resource.msg.restore();
        });

        it('should create custom error message', () => {
            expect(utils.createErrorMsg('customerror')).to.equal('custom error message');
        });
    });

    describe('tryParseJSON', () => {
        const createErrorLogStub = stub();

        before(() => {
            utils.__set__('createErrorLog', createErrorLogStub);
        });

        after(() => {
            utils.__ResetDependency__('createErrorLog');
        });

        it('if the element was successfully parsed, and result returned', () => {
            const element = {
                testKey: 'testValue',
                testArr: []
            };

            const result = utils.tryParseJSON(JSON.stringify(element));

            expect(result).to.be.an('object');
            expect(result).to.deep.equal(element);

            expect(createErrorLogStub.notCalled).to.be.true;
        });

        it('if the element was invalid, and error appeared', () => {
            const element = '[1, 2, 3, 4, ]';

            const result = utils.tryParseJSON(element);

            expect(result).to.equal(undefined);

            expect(createErrorLogStub.calledWithMatch('Unable to parse:   [1, 2, 3, 4, ] SyntaxError: Unexpected token')).to.be.true;
        });
    });

    describe('addFlashMessagesCustomAttribute', () => {
        const systemObj = { custom: {} };
        const firstMsg = { text: 'text', type: 'danger' };
        const secondMsg = { text: 'text', type: 'info' };

        it('should add flash message', () => {
            utils.addFlashMessagesCustomAttribute(systemObj, 'text', 'danger');
            expect(systemObj.custom).to.have.property('flashMessages').that.deep.equals(JSON.stringify([firstMsg]));
        });

        it('should add another flash message to the existing one', () => {
            utils.__set__('tryParseJSON', () => [firstMsg]);
            utils.addFlashMessagesCustomAttribute(systemObj, 'text', 'info');
            expect(systemObj.custom).to.have.property('flashMessages').that.deep.equals(JSON.stringify([firstMsg, secondMsg]));
        });
    });

    describe('getUserAgent', () => {
        before(() => {
            request.httpHeaders = {
                get: stub().withArgs('user-agent').returns(undefined)
            };
        });
        after(() => {
            delete request.httpHeaders;
        });

        it('should return an empty string if user-agent is not present in headers', () => {
            expect(utils.getUserAgent()).to.be.equal('');
        });

        it('should return the user-agent if present in headers', () => {
            request.httpHeaders.get = stub().withArgs('user-agent').returns('chrome');

            expect(utils.getUserAgent()).to.be.equal('chrome');
        });
    });

    describe('reverseString', () => {
        it('should return a reversed string', () => {
            expect(utils.reverseString('test')).to.equal('tset');
        });
    });

    describe('isNotSameUserAgent', () => {
        before(() => {
            request.httpHeaders = {
                get: stub().withArgs('user-agent').returns('chrome')
            };
            request.httpParameterMap = {
                uaRef: {
                    stringValue: 'l12byh2Y' // Base64 for 'chrome' and reversed
                }
            };
        });

        after(() => {
            delete request.httpHeaders;
            delete request.httpParameterMap;
        });

        it('should return a boolean', () => {
            expect(utils.isNotSameUserAgent()).to.be.a('boolean');
        });

        it('should return false if user-agent and url param match', () => {
            expect(utils.isNotSameUserAgent()).to.be.false;
        });

        it('should return false if url param is empty', () => {
            request.httpParameterMap.uaRef.stringValue = '';

            expect(utils.isNotSameUserAgent()).to.be.false;
        });

        it('should return true if user-agent and url param do not match', () => {
            request.httpParameterMap.uaRef.stringValue = 'mismatchedValue';

            expect(utils.isNotSameUserAgent()).to.be.true;
        });
    });
});
