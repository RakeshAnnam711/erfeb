const { int_paypal: { httpClientOcapiPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

request.httpHost = 'zzzz-000.dx.commercecloud.salesforce.com';

const proxyquire = require('proxyquire').noCallThru();

const open = stub();
const setTimeout = stub();
const setRequestHeader = stub();
const getResponseHeader = stub();
const tryParseJSON = stub();
const createErrorLog = stub();

const mockResponse = { data: {} };
const mockHttpClient = {
    statusCode: 200,
    open: open,
    setTimeout: setTimeout,
    setRequestHeader: setRequestHeader,
    send: (data) => {
        if (!data) {
            mockHttpClient.text = JSON.stringify(mockResponse);
        }
    },
    getResponseHeader: getResponseHeader,
    text: null
};
const mockShippingAddress = {
    state_code: 'state_code',
    postal_code: 'postal_code',
    city: 'city',
    country_code: 'country_code'
};

const version = 'v23_2';
const basketId = 'basket_test';
const shipmentId = 'shipment_test';
const baseResource = `/baskets/${basketId}/shipments/${shipmentId}`;
const baseUrl = `https://${request.httpHost}/s/RefArch/dw/shop/${version}`;

const UPDATE_BASKET_SHIPPING_METHOD = `${baseResource}/shipping_method`;

require('dw-api-mock/demandware-globals');

const HttpClientOcapi = proxyquire(httpClientOcapiPath, {
    '*/cartridge/config/preferences': {
        ocapiConfig: {
            apiVersion: '23.2',
            clientId: '12345'
        }
    },
    'dw/system/Site': {
        current: {
            ID: 'RefArch'
        }
    },
    'dw/net/HTTPClient': function() {
        return mockHttpClient;
    },
    '*/cartridge/scripts/paypal/utils': {
        tryParseJSON: tryParseJSON
    },
    '~/cartridge/scripts/paypal/utils': {
        createErrorLog: createErrorLog
    },
    '~/cartridge/config/constants': {
        DWSID: 'dwsid'
    }
});

describe('httpClientOcapi file', () => {
    const testResource = '/customers/auth';
    const timeout = 3000;
    const httpClientOcapiInstance = new HttpClientOcapi();

    before(() => {
        tryParseJSON.returns(mockResponse);
    });

    after(() => {
        delete request.httpHost;

        tryParseJSON.reset();
    });

    afterEach(() => {
        tryParseJSON.returns(mockResponse);

        httpClientOcapiInstance.statusCode = 200;
    });

    describe('HttpClientOcapi', () => {
        it('should be a function', () => {
            expect(new HttpClientOcapi()).to.be.a.function;
        });

        it('should have value httpClientInstance', () => {
            expect(httpClientOcapiInstance).has.property('httpClientInstance').which.is.equals(mockHttpClient);
        });

        it('should have value jwt', () => {
            expect(httpClientOcapiInstance).has.property('jwt');
        });
    });

    describe('getVersion', () => {
        const getVersion = HttpClientOcapi.__get__('getVersion');

        it('should return formatted version of the OCAPI', () => {
            expect(getVersion()).to.be.equal(version);
        });
    });

    describe('generateBaseUrl', () => {
        const generateBaseUrl = HttpClientOcapi.__get__('generateBaseUrl');

        it('should return formatted url for OCAPI call', () => {
            const testUrl = `https://${request.httpHost}/s/RefArch/dw/shop/${version}${testResource}`;

            expect(generateBaseUrl(testResource)).to.be.equal(testUrl);
        });
    });

    describe('handleError', () => {
        after(() => {
            httpClientOcapiInstance.statusCode = 200;
            tryParseJSON.reset();
        });

        it('should throw an error if status code is not 200', () => {
            const error = JSON.stringify({
                fault: {
                    message: 'error'
                }
            });

            httpClientOcapiInstance.httpClientInstance.statusCode = 500;
            httpClientOcapiInstance.httpClientInstance.errorText = error;

            tryParseJSON.returns(JSON.parse(error));

            expect(() => httpClientOcapiInstance.handleError()).to.throw();
            expect(createErrorLog.calledOnce).to.be.true;
            expect(tryParseJSON.calledOnce).to.be.true;
        });

        it('should return undefined if status is 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            expect(httpClientOcapiInstance.handleError()).to.be.undefined;
        });
    });

    describe('initJWTForSession', () => {
        const testSessionId = 'sessionId';
        const method = 'POST';
        const url = `https://${request.httpHost}/s/RefArch/dw/shop/${version}${testResource}`;
        const jwt = 'jwt-test';
        const tokenData = {
            name: 'dwsecuretoken',
            value: 'token'
        };

        before(() => {
            getResponseHeader.withArgs('authorization').returns(jwt);
            tryParseJSON.returns(tokenData);
        });

        after(() => {
            httpClientOcapiInstance.statusCode = 200;

            setTimeout.reset();
            open.reset();
            setRequestHeader.reset();
        });

        it('should create jwt and set it to the constructor', () => {
            httpClientOcapiInstance.initJWTForSession(testSessionId, JSON.stringify(tokenData));

            expect(open.withArgs(method, url).calledOnce).to.be.true;
            expect(setTimeout.withArgs(timeout).calledOnce).to.be.true;
            expect(setRequestHeader.withArgs('Content-Type', 'application/json').called).to.be.true;
            expect(setRequestHeader.withArgs('x-dw-client-id', '12345').called).to.be.true;
            expect(setRequestHeader.withArgs('Cookie', `dwsid=${testSessionId};${tokenData.name}=${tokenData.value}`).called).to.be.true;

            expect(httpClientOcapiInstance.jwt).to.be.equal(jwt);
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.initJWTForSession(testSessionId)).to.throw();
        });
    });

    describe('get', () => {
        const basketResource = '/baskets/basket_id';
        const url = `https://${request.httpHost}/s/RefArch/dw/shop/${version}${basketResource}`;

        after(() => {
            httpClientOcapiInstance.statusCode = 200;

            setTimeout.reset();
            open.reset();
            setRequestHeader.reset();
        });

        it('should create GET request to the OCAPI resource', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            const result = httpClientOcapiInstance.get(basketResource);

            expect(result).to.deep.equals(mockResponse);

            expect(open.withArgs('GET', url).calledOnce).to.be.true;
            expect(setTimeout.withArgs(timeout).calledOnce).to.be.true;
            expect(setRequestHeader.withArgs('Authorization', httpClientOcapiInstance.jwt).calledOnce).to.be.true;
            expect(tryParseJSON.withArgs(mockHttpClient.text).calledOnce).to.be.true;
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.get(basketResource)).to.throw();
        });
    });

    describe('getBasket', () => {
        it('should return a basket data', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            const basketData = httpClientOcapiInstance.getBasket(basketId);

            expect(basketData).to.deep.equals(mockResponse);
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.getBasket(basketId)).to.throw();
        });
    });

    describe('getBasketApplicableShippingMethods', () => {
        it('should return applicable shipping methods data', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            const shippingMethodsData = httpClientOcapiInstance.getBasketApplicableShippingMethods(basketId, shipmentId);

            expect(shippingMethodsData).to.deep.equals(mockResponse);
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.getBasketApplicableShippingMethods(basketId, shipmentId)).to.throw();
        });
    });

    describe('updateBasketShippingAddress', () => {
        const UPDATE_BASKET_SHIPPING_ADDRESS = `${baseResource}/shipping_address`;

        const url = `${baseUrl}${UPDATE_BASKET_SHIPPING_ADDRESS}`;

        after(() => {
            open.reset();
            setTimeout.reset();
            setRequestHeader.reset();
        });

        it('should update shipment shipping address of basket' , () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            httpClientOcapiInstance.updateBasketShippingAddress(mockShippingAddress, basketId, shipmentId);

            expect(open.withArgs('PUT', url).calledOnce).to.be.true;
            expect(setTimeout.withArgs(timeout).called).to.be.true;
            expect(setRequestHeader.withArgs('Authorization', httpClientOcapiInstance.jwt).called).to.be.true;
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.updateBasketShippingAddress(shippingAddress, basketId, shipmentId)).to.throw();
        });
    });

    describe('updateBasketShippingMethod', () => {
        const shippingMethod = {
            id: '001'
        };

        const url = `${baseUrl}${UPDATE_BASKET_SHIPPING_METHOD}`;

        after(() => {
            open.reset();
            setTimeout.reset();
            setRequestHeader.reset();
        });

        it('should update shipment shipping method of basket' , () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            httpClientOcapiInstance.updateBasketShippingMethod(shippingMethod, basketId, shipmentId);

            expect(open.withArgs('PUT', url).calledOnce).to.be.true;
            expect(setTimeout.withArgs(timeout).called).to.be.true;
            expect(setRequestHeader.withArgs('Authorization', httpClientOcapiInstance.jwt).called).to.be.true;
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.updateBasketShippingAddress(shippingMethod, basketId, shipmentId)).to.throw();
        });
    });

    describe('put', () => {
        const url = `${baseUrl}${UPDATE_BASKET_SHIPPING_METHOD}`;

        after('', () => {
            open.reset();
            setTimeout.reset();
            setRequestHeader.reset();
        });

        it('should make PUT request to the provided resource', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 200;

            const result = httpClientOcapiInstance.put(UPDATE_BASKET_SHIPPING_METHOD, mockShippingAddress);

            expect(result).to.deep.equals(mockResponse);
            expect(open.withArgs('PUT', url).calledOnce).to.be.true;
            expect(setTimeout.withArgs(timeout).called).to.be.true;
            expect(setRequestHeader.withArgs('Authorization', httpClientOcapiInstance.jwt).called).to.be.true;
        });

        it('should throw an error if status code is not 200', () => {
            httpClientOcapiInstance.httpClientInstance.statusCode = 501;

            expect(() => httpClientOcapiInstance.put(UPDATE_BASKET_SHIPPING_METHOD, mockShippingAddress)).to.throw();
        });
    });
});
