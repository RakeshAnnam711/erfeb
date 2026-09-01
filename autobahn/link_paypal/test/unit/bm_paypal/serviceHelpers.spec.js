/* eslint-disable object-curly-newline */

const { bm_paypal: { serviceHelpersPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const { it, describe, after } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const createErrorLogFake = stub();
const getValueByKeyFake = stub();

const serviceHelpers = proxyquire(serviceHelpersPath, {
    'dw/web/Resource': dw.web.Resource,
    '~/cartridge/scripts/helpers/coreHelpers': {
        getValueByKey: getValueByKeyFake
    },
    '~/cartridge/config/constants': {
        INVALID_CLIENT: 'invalid_client',
        SERVICE_NAME: 'int_paypal.http.rest',
        ERRORS_WHITE_LIST: [
            'INVALID_RESOURCE_ID',
            'REFUND_AMOUNT_EXCEEDED',
            'MAX_CAPTURE_AMOUNT_EXCEEDED'
        ]
    },
    '~/cartridge/scripts/paypal/utils': {
        createErrorLog: createErrorLogFake
    }
});

describe('serviceHelpers file', () => {
    describe('errorHandler', () => {
        const requestData = {};

        const errorResponse = {
            configuration: {
                credential: {}
            }
        };

        after(() => {
            getValueByKeyFake.resetBehavior();
        });

        it('if there is no errorMessage', () => {
            expect(() => serviceHelpers.errorHandler(errorResponse, requestData)).to.throw(Error);
        });

        it('if error has details', () => {
            errorResponse.errorMessage = '{"name" : "name", "details": [{"issue" : "invalid_client", "description" : "description"}]}';

            const errorData = JSON.parse(errorResponse.errorMessage);

            getValueByKeyFake.withArgs(errorData, 'details.0.issue').returns('invalid_client');
            getValueByKeyFake.withArgs(errorData, 'details.0.description').returns('description');

            expect(() => serviceHelpers.errorHandler(errorResponse, requestData)).to.throw('description');
        });

        it('if error has not details', () => {
            errorResponse.errorMessage = '{"name" : "name", "message": "message"}';

            const errorData = JSON.parse(errorResponse.errorMessage);

            getValueByKeyFake.withArgs(errorData, 'details.0.issue', errorData.name).returns('name');
            getValueByKeyFake.withArgs(errorData, 'details.0.description', errorData.message).returns('message');

            expect(() => serviceHelpers.errorHandler(errorResponse, requestData)).to.throw('message');
        });

        it('if errorName is invalid_client', () => {
            errorResponse.errorMessage = '{"error":"invalid_client", "error_description":"error description"}';
            errorResponse.configuration.credential.ID = 'credentialID';

            expect(() => serviceHelpers.errorHandler(errorResponse, requestData)).to.throw('error description');
        });

        it('if errorName is not invalid_client', () => {
            errorResponse.errorMessage = '{"error":"INVALID_RESOURCE_ID", "error_description":"error description for unknown"}';

            expect(() => serviceHelpers.errorHandler(errorResponse, requestData)).to.throw('error description for unknown');
        });
    });
});
