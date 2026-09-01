const { int_paypal: { paypalRESTPath } } = require('../path.json');

const { expect } = require('chai');
const {
    it, describe, beforeEach, afterEach
} = require('mocha');

const { stub } = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const get = stub();
const put = stub();
const ACCESS_TOKEN = 'access_token';
const jwtResult = 'eyJhbGciOiJub25lIn0=.eyJpc3MiOiJtb2NrLWNsaWVudC1pZCIsInBheWVyX2lkIjoicGF5cGFsLW1lcmNoYW50LWlkIn0=.';
const btoa = (data) => Buffer.from(data).toString('base64');

const ServiceCredential = function() {};

let status = true;

const preferences = {
    domainList: [],
    paypalMerchantId: 'paypal-merchant-id'
};

const LocalServiceRegistry = {
    createService: (name, obj) => ({
        call: () => ({
            isOk: () => status,
            object: {
                createRequest: obj.createRequest,
                parseResponse: obj.parseResponse,
                filterLogMessage: obj.filterLogMessage,
                getRequestLogMessage: obj.getRequestLogMessage,
                getResponseLogMessage: obj.getResponseLogMessage
            }
        })
    })
};

const dependencies = {
    'int_paypal.http.rest': 'serviceName',
    'dw/svc/ServiceCredential': ServiceCredential,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry,
    'dw/web/Resource': {
        msgf: () => {},
        msg: () => {
            return 'Unknown error occurred';
        }
    },
    'dw/system/CacheMgr': {
        getCache: () => ({
            get,
            put
        })
    },
    'dw/system/Site': {
        current: {
            ID: 'RefArch'
        }
    },
    '*/cartridge/scripts/paypal/utils': {
        createErrorLog: () => {},
        getClientId: () => 'mock-client-id',
        encodeString: (obj) => btoa(JSON.stringify(obj))
    },
    '*/cartridge/scripts/paypal/helpers/paypalHelper': {
        getUrlPath: () => {},
        getAccessToken: () => ACCESS_TOKEN
    },
    '*/cartridge/config/constants': {
        ACCESS_TOKEN: ACCESS_TOKEN
    },
    '*/cartridge/config/preferences': preferences
};

const paypalREST = proxyquire(paypalRESTPath, dependencies);

describe('paypalREST file', () => {
    const resService = paypalREST.call();

    it('if can not create service instance', () => {
        LocalServiceRegistry.createService = () => {
            throw new Error();
        };

        expect(() => proxyquire(paypalRESTPath, dependencies)).to.throw();
    });

    it('if result is not Ok', () => {
        status = false;

        expect(() => paypalREST.call()).to.throw();
    });

    describe('parseResponse', () => {
        it('should parse', () => {
            expect(resService.parseResponse({}, { getText: () => '{"prop": "value"}' })).to.be.deep.equal({ prop: 'value' });
        });
    });

    describe('filterLogMessage', () => {
        it('should return message', () => {
            expect(resService.filterLogMessage('msg')).to.be.equal('msg');
        });
    });

    describe('getRequestLogMessage', () => {
        it('should return request', () => {
            expect(resService.getRequestLogMessage('request')).to.be.equal('request');
        });
    });

    describe('getResponseLogMessage', () => {
        it('should return request', () => {
            expect(resService.getResponseLogMessage({ text: 'response' })).to.be.equal('response');
        });
    });

    describe('createRequest', () => {
        const reqService = {
            configuration: {
                credential: new ServiceCredential()
            },
            setURL: () => {},
            setRequestMethod: () => {},
            addHeader: stub()
        };

        const reqData = {
            setRequestMethod: () => {},
            setURL: () => {},
            path: '',
            method: '',
            body: '',
            createToken: '',
            partnerAttributionId: '',
            fastlane: false
        };

        beforeEach(() => {
            reqService.configuration.credential = new ServiceCredential();
        });

        afterEach(() => {
            reqService.addHeader.reset();
            reqData.partnerAttributionId = '';
            reqData.createToken = '';
            reqData.fastlane = false;
            get.returns('');
            status = true;
        });

        it('should throw an error while credentials is not instanceof ServiceCredential', () => {
            reqService.configuration.credential = {};
            reqData.createToken = 'createToken';

            expect(() => resService.createRequest(reqService, reqData)).to.throw();
        });

        it('must return empty string if there is createToken', () => {
            reqData.createToken = 'createToken';

            expect(resService.createRequest(reqService, reqData)).to.be.equal('');
        });

        it('must return empty string and add header if fastlane is true', () => {
            reqData.fastlane = true;

            resService.createRequest(reqService, reqData);

            expect(reqService.addHeader.calledWith('Authorization', 'Basic ' + ACCESS_TOKEN)).to.be.true;
            expect(resService.createRequest(reqService, reqData)).to.be.equal('');
        });

        it('if there is bearerToken and partnerAttributionId', () => {
            reqData.partnerAttributionId = 'partnerAttributionId';
            get.returns('bearerToken');

            expect(resService.createRequest(reqService, reqData)).to.be.equal('');
        });

        it('if there is bearerToken and body', () => {
            reqData.body = {
                key: 'value'
            };
            get.returns('bearerToken');

            expect(resService.createRequest(reqService, reqData)).to.be.equal('{"key":"value"}');
        });

        it('if there is payPalRequestId', () => {
            reqData.payPalRequestId = 'payPalRequestId';
            get.returns('bearerToken');

            expect(resService.createRequest(reqService, reqData)).to.be.equal('{"key":"value"}');
        });

        it('should use existed accessToken', () => {
            reqData.accessToken = 'accessToken';
            reqData.createToken = false;
            resService.createRequest(reqService, reqData);

            expect(reqService.addHeader.calledWith('Authorization', 'Bearer ' + reqData.accessToken)).to.be.true;
        });

        it('should use got headers', () => {
            const headers = {
                'AuthorizationTest': 'Bearer 123456ASD',
                'Content-TypeTest': 'application/x-www-form-urlencoded'
            };

            reqData.headers = headers;

            resService.createRequest(reqService, reqData);

            expect(reqService.addHeader.calledWith('AuthorizationTest', 'Bearer 123456ASD')).to.be.true;
            expect(reqService.addHeader.calledWith('Content-TypeTest', 'application/x-www-form-urlencoded')).to.be.true;
        });

        it('should add headers if req type is ACCESS_TOKEN ', () => {
            reqData.requestType = ACCESS_TOKEN;
            reqData.code = 200;

            expect(resService.createRequest(reqService, reqData)).to.deep.equal('grant_type=authorization_code&code=' + reqData.code);

            expect(reqService.addHeader.calledWith('Content-Type', 'application/x-www-form-urlencoded')).to.be.true;
            expect(reqService.addHeader.calledWith('Authorization', 'Basic ' + ACCESS_TOKEN)).to.be.true;
        });

        it('should add header PayPal-Auth-Assertion and PAYPAL-CLIENT-METADATA-ID', () => {
            reqData.authAssertion = true;
            reqData.payPalClientMetadataId = 'client-metadata-id';

            resService.createRequest(reqService, reqData);

            expect(reqService.addHeader.calledWith('PAYPAL-CLIENT-METADATA-ID', reqData.payPalClientMetadataId)).to.be.true;
            expect(reqService.addHeader.calledWith('PayPal-Auth-Assertion', jwtResult)).to.be.true;
        });
    });

    describe('getToken', () => {
        // eslint-disable-next-line no-underscore-dangle
        const getToken = paypalREST.__get__('getToken');

        const reqService = {
            setThrowOnError: () => ({
                call: () => {}
            }),
            response: {}
        };

        afterEach(() => {
            get.returns('');
            reqService.response = {};
        });

        it('if there is bearerToken', () => {
            get.returns('bearerToken');

            expect(getToken(reqService)).to.be.equal('Bearer bearerToken');
        });

        it('if there is access_token ', () => {
            reqService.response.access_token = 'access_token';
            put.returns('access_token');

            expect(getToken(reqService)).to.be.equal('Bearer access_token');
        });

        it('if there is error_description', () => {
            reqService.response.error_description = 'error_description';

            expect(() => getToken(reqService)).to.throw('error_description');
        });

        it('if there is error without any description', () => {
            expect(() => getToken(reqService)).to.throw('Unknown error occurred');
        });
    });

    describe('errorHandler', () => {
        const errorHandler = paypalREST.__get__('errorHandler');

        const errorResponse = {
            configuration: {
                credential: {}
            }
        };

        const requestData = {};

        it('if there is no errorMessage', () => {
            expect(() => errorHandler(errorResponse, requestData)).to.throw(Error);
        });

        it('if error has details', () => {
            errorResponse.errorMessage = '{"name" : "name", "details": [{"issue" : "issue", "description" : "description"}]}';

            expect(() => errorHandler(errorResponse, requestData)).to.throw('issue');
        });

        it('if error has not details', () => {
            errorResponse.errorMessage = '{"name" : "name", "message": "message"}';

            expect(() => errorHandler(errorResponse, requestData)).to.throw('name');
        });

        it('if errorName is invalid_client', () => {
            errorResponse.errorMessage = '{"error":"invalid_client", "description":"error description"}';
            errorResponse.configuration.credential.ID = 'credentialID';

            expect(() => errorHandler(errorResponse, requestData)).to.throw('invalid_client');
        });

        it('if errorName is not invalid_client', () => {
            errorResponse.errorMessage = '{"error":"unknown_error", "description":"error description"}';

            expect(() => errorHandler(errorResponse, requestData)).to.throw('unknown_error');
        });
    });

    describe('getUrl', () => {
        const getUrl = paypalREST.__get__('getUrl');

        it('should return the base URL when createToken is true', () => {
            expect(getUrl(true, null, null)).to.equal('v1/oauth2/token?grant_type=client_credentials');
        });

        it('should return URL with target_customer_id when payPalCustomerId is provided', () => {
            expect(getUrl(false, 'customer123', null)).to.equal('v1/oauth2/token?grant_type=client_credentials&response_type=id_token&target_customer_id=customer123');
        });

        it('should return URL with client_token when fastlane is true and domainList is empty', () => {
            preferences.domainList = [];

            expect(getUrl(false, null, true)).to.equal('v1/oauth2/token?grant_type=client_credentials&response_type=client_token&intent=sdk_init');
        });

        it('should return URL with client_token when fastlane is true and domainList exist', () => {
            preferences.domainList = ['example.com', 'example.com2', 'example.com3'];

            expect(getUrl(false, null, true)).to.equal('v1/oauth2/token?grant_type=client_credentials&response_type=client_token&intent=sdk_init&domains=example.com,example.com2,example.com3');
        });

        it('should return URL with id_token when no conditions are met but payPalCustomerId is provided', () => {
            expect(getUrl(false, 'payPalCustomerId', false)).to.equal('v1/oauth2/token?grant_type=client_credentials&response_type=id_token&target_customer_id=payPalCustomerId');
        });

        it('should return the base URL for all false values', () => {
            expect(getUrl(false, null, null)).to.equal('v1/oauth2/token?grant_type=client_credentials&response_type=id_token');
        });
    });

    describe('getJwt', () => {
        const getJwt = paypalREST.__get__('getJwt');

        it('should return a jwt token (base64 with three parts separated by dots', () => {
            expect(getJwt()).to.be.equal(jwtResult);
        });
    });
});
