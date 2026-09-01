const { bm_paypal: { paypalRESTPath } } = require('../path.json');

const { describe, it, afterEach } = require('mocha');
const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const ServiceCredential = function(url) {
    this.URL = url;
};

const getTokenCache = stub();
const jwtResult = 'eyJhbGciOiJub25lIn0=.eyJpc3MiOiJtb2NrLWNsaWVudC1pZCIsInBheWVyX2lkIjoicGF5cGFsLW1lcmNoYW50LWlkIn0=.';
const btoa = (data) => Buffer.from(data).toString('base64');

const paypalREST = require('proxyquire').noCallThru()(paypalRESTPath, {
    'dw/svc/ServiceCredential': ServiceCredential,
    'dw/web/Resource': dw.web.Resource,
    'dw/system/Site': {
        current: {
            ID: 'RefArch'
        }
    },
    'dw/svc/LocalServiceRegistry': {
        createService: (name, obj) => ({
            createRequest: obj.createRequest,
            parseResponse: obj.parseResponse,
            filterLogMessage: obj.filterLogMessage,
            getRequestLogMessage: obj.getRequestLogMessage,
            getResponseLogMessage: obj.getResponseLogMessage
        })
    },
    'dw/system/CacheMgr': {
        getCache: () => {
            return {
                get: getTokenCache,
                put: () => {}
            };
        }
    },
    '~/cartridge/config/constants': {
        SERVICE_NAME: 'service'
    },
    '~/cartridge/config/preferences': {
        clientId: 'mock-client-id',
        paypalMerchantId: 'paypal-merchant-id'
    },
    '~/cartridge/scripts/paypal/utils': {
        encodeString: (obj) => btoa(JSON.stringify(obj))
    }
});

describe('paypalREST file', () => {
    const service = paypalREST();

    describe('createRequest', () => {
        const reqService = {
            response: {
                error_description: null,
                access_token: 'access token'
            },
            configuration: { credential: new ServiceCredential('url') },
            setURL: function(url) {
                this.response.url = url;
            },
            addHeader: function(key, value) {
                this.response.header[key] = value;
            },
            setRequestMethod: function(method) {
                this.response.method = method;
            },
            setThrowOnError: () => {
                return { call: () => ({ ok: true }) };
            }
        };

        const reqData = {
            path: null,
            method: null,
            body: null,
            createToken: null,
            partnerAttributionId: null,
            payPalRequestId: null
        };

        afterEach(() => {
            getTokenCache.reset();
            reqService.configuration.credential = new ServiceCredential('url');
            reqService.response.error_description = null;
            reqService.response.url = null;
            reqService.response.header = {};
            reqService.response.method = null;
            reqData.createToken = null;
            reqData.body = null;
            reqData.path = null;
            reqData.method = null;
            reqData.partnerAttributionId = null;
            reqData.payPalRequestId = null;
        });

        it('result should be an error if credentials aren\'t an instance of ServiceCredential', () => {
            reqService.configuration.credential = {};

            expect(() => service.createRequest(reqService, reqData)).to.throw();
        });

        it('result should be an error if there\'s no token in cache & reqService.response.error_description is set to true', () => {
            getTokenCache.returns(null);
            reqService.response.error_description = true;

            expect(() => service.createRequest(reqService, reqData)).to.throw();
        });

        it('result should be reqService.response.header.Authorization set to "Bearer access token" if there\'s no token in cache', () => {
            getTokenCache.returns(null);

            expect(service.createRequest(reqService, reqData)).to.equal('');
            expect(reqService.response.header).to.have.property('Authorization').that.equals('Bearer access token');
        });

        it('result should be a correctly built url if ServiceCredential takes an url ending in a slash as a value', () => {
            reqService.configuration.credential = new ServiceCredential('url/');
            reqData.path = 'path';

            expect(service.createRequest(reqService, reqData)).to.equal('');
            expect(reqService.response.url).to.equal('url/path');
        });

        it('result should be url and header set to their values if createToken is present in reqData', () => {
            reqData.createToken = true;

            expect(service.createRequest(reqService, reqData)).to.equal('');
            expect(reqService.response.url).to.equal('url/v1/oauth2/token?grant_type=client_credentials');
            expect(reqService.response.header).to.have.property('Content-Type').that.equals('application/x-www-form-urlencoded');
        });

        it('result should be a parsed reqData.body returned & url, method & header set to their values if reqData comes with values', () => {
            getTokenCache.returns('paypalRestOauthToken');
            reqData.body = {};
            reqData.path = 'path';
            reqData.method = 'get';
            reqData.partnerAttributionId = 'partnerAttributionId';
            reqData.payPalRequestId = 'payPalRequestId';
            reqData.authAssertion = true;

            expect(service.createRequest(reqService, reqData)).to.equal('{}');
            expect(reqService.response.url).to.equal('url/path');
            expect(reqService.response.method).to.equal('get');
            expect(reqService.response.header).to.have.property('Content-Type').that.equals('application/json');
            expect(reqService.response.header).to.have.property('Authorization').that.equals('Bearer paypalRestOauthToken');
            expect(reqService.response.header).to.have.property('PayPal-Partner-Attribution-Id').that.equals('partnerAttributionId');
            expect(reqService.response.header).to.have.property('PayPal-Request-Id').that.equals('payPalRequestId');
            expect(reqService.response.header).to.have.property('PayPal-Auth-Assertion').that.equals(jwtResult);
        });
    });

    describe('parseResponse', () => {
        it('result should be equal to 200', () => {
            expect(service.parseResponse({}, { getText: () => '200' })).to.equal(200);
        });
    });

    describe('filterLogMessage', () => {
        it('result should be equal to "msg"', () => {
            expect(service.filterLogMessage('msg')).to.equal('msg');
        });
    });

    describe('getRequestLogMessage', () => {
        it('result should be equal to "request msg"', () => {
            expect(service.getRequestLogMessage('request msg')).to.equal('request msg');
        });
    });

    describe('getResponseLogMessage', () => {
        it('result should be equal to "log msg"', () => {
            expect(service.getResponseLogMessage({ text: 'log msg' })).to.equal('log msg');
        });
    });

    describe('getJwt', () => {
        const getJwt = paypalREST.__get__('getJwt');

        it('should return a jwt token (base64 with three parts separated by dots', () => {
            expect(getJwt()).to.be.equal(jwtResult);
        });
    });

    describe('getToken', () => {
        it('should call errorHandler if result.ok is false', () => {
            const errorHandler = stub();

            const paypalRESTWithTokenError = require('proxyquire').noCallThru()(paypalRESTPath, {
                'dw/svc/ServiceCredential': ServiceCredential,
                'dw/web/Resource': dw.web.Resource,
                'dw/svc/LocalServiceRegistry': {
                    createService: (name, obj) => ({
                        createRequest: obj.createRequest,
                        parseResponse: obj.parseResponse,
                        filterLogMessage: obj.filterLogMessage,
                        getRequestLogMessage: obj.getRequestLogMessage,
                        getResponseLogMessage: obj.getResponseLogMessage,
                        setThrowOnError: () => ({
                            call: () => ({
                                ok: false,
                                response: {
                                    error_description: 'Simulated error from response'
                                }
                            })
                        })
                    })
                },
                'dw/system/Site': {
                    current: {
                        ID: 'RefArch'
                    }
                },
                'dw/system/CacheMgr': {
                    getCache: () => ({
                        get: () => null,
                        put: () => {}
                    })
                },
                '~/cartridge/config/constants': {
                    SERVICE_NAME: 'service'
                },
                '~/cartridge/config/preferences': {
                    clientId: 'mock-client-id',
                    paypalMerchantId: 'paypal-merchant-id'
                },
                '~/cartridge/scripts/paypal/utils': {
                    encodeString: (obj) => btoa(JSON.stringify(obj))
                },
                '~/cartridge/scripts/helpers/serviceHelpers': {
                    errorHandler
                }
            });

            const getToken = paypalRESTWithTokenError.__get__('getToken');

            const serviceMock = {
                setThrowOnError: () => ({
                    call: () => ({
                        ok: false,
                        response: {
                            error_description: 'Simulated error from response'
                        }
                    })
                }),
                response: {
                    error_description: 'Simulated error from response'
                }
            };

            try {
                getToken(serviceMock);
            } catch (e) {
                // expecting errors
            }

            expect(errorHandler.calledOnce).to.be.true;
        });
    });
});
