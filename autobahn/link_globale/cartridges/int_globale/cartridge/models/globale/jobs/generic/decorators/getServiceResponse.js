'use strict';

/**
 * Processes service result
 * @throws {Error}
 * @param {dw.svc.Result} serviceResult - service call result
 * @return {Object} - service response
 */
function getServiceResponse(serviceResult) {
    var Result = require('dw/svc/Result');
    var serviceResultResponse;

    switch (serviceResult.status) {
        case Result.OK:
            serviceResultResponse = JSON.parse(serviceResult.object.text);
            break;
        case Result.ERROR:
            try {
                serviceResultResponse = JSON.parse(serviceResult.errorMessage);
            } catch (e) {
                serviceResultResponse = { Error: serviceResult.errorMessage, Code: serviceResult.error };
            }
            break;
        case Result.SERVICE_UNAVAILABLE:
            throw Error('Global-e service is unavailable: ' + serviceResult.unavailableReason + '.');
        default:
            break;
    }

    return serviceResultResponse;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getServiceResponse: {
            enumerable: true,
            value: getServiceResponse
        }
    });
};
