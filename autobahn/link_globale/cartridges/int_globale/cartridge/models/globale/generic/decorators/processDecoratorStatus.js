/* eslint-disable no-param-reassign */

'use strict';

/**
 * Processes action status returned by other decorators
 * @throws {Error}
 * @param {dw.system.Status} status - decorator action status
 * @param {Object} response - action response
 */
function processDecoratorStatus(status, response) {
    var statusMessage = status.getMessage();
    if (status.isError()) {
        response.errorCode = Number(status.getCode());
        response.errorMessage = statusMessage;
        throw new Error(response.errorMessage);
    }

    if (statusMessage && statusMessage !== 'OK') {
        response.addExecutionNote(status.getMessage());
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        processDecoratorStatus: {
            value: processDecoratorStatus
        }
    });
};
