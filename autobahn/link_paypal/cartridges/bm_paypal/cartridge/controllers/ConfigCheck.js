'use strict';

/**
 * @namespace ConfigCheck
 */

const server = require('server');

const Resource = require('dw/web/Resource');

const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');
const configCheckHelpers = require('~/cartridge/scripts/helpers/configCheckHelpers');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

const failureMessage = Resource.msg('test.connection.notification.failure', 'notifications', null);

/**
 * Test service connection
 */
server.post('TestServiceConnection',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        const result = {
            error: false,
            message: Resource.msg('test.connection.notification.success', 'notifications', null)
        };

        try {
            const serviceResponse = configCheckHelpers.getResponseFromService();
            const service = serviceResponse.service;
            const serviceResult = serviceResponse.serviceResult;

            result.service = {
                id: service.configuration.ID,
                status: serviceResult.status,
                request: service.requestData || serviceResponse.path,
                response: JSON.stringify(serviceResponse),
                user: coreHelpers.checkSetValue(service.configuration.credential.user),
                password: coreHelpers.checkSetValue(service.configuration.credential.password)
            };

            const requestBody = coreHelpers.tryParseJSON(req.body) || {};

            if (!serviceResult.ok || serviceResponse.error) {
                result.error = true;
                result.message = failureMessage;

                if (requestBody.isExport) {
                    result.message = Resource.msg('configcheck.export.testconnection.failure', 'preferences', null);
                }
            }
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');
            const constants = require('~/cartridge/config/constants');

            responseHelper.handleControllerError(error, res, 400);

            const errorMsg = error.message === constants.CLIENT_AUTHENTICATION_FAILED
                ? failureMessage
                : error.message;

            result.error = true;
            result.message = errorMsg;
        }

        res.json({ result: result });

        next();
    }
);

/**
 * Test business flow`s configs
 */
server.post('SelfCheck',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        const result = {
            checkedPM: {},
            checkedFlow: {},
            checkedServices: []
        };

        try {
            const requestBody = coreHelpers.tryParseJSON(req.body);

            result.checkedPM = configCheckHelpers.checkPaymentMethod(requestBody.payments);
            result.checkedFlow = configCheckHelpers.checkFlow(requestBody.flows);

            const checkedService = {
                isValid: false,
                name: requestBody.services[0],
                alert: failureMessage
            };

            result.checkedServices.push(checkedService);

            const serviceResponse = configCheckHelpers.getResponseFromService();

            checkedService.isValid = serviceResponse.serviceResult.ok && !serviceResponse.error;
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 400);
        }

        res.json({ result: result });

        next();
    }
);

module.exports = server.exports();
