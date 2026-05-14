'use strict';

/**
 * Global-e ErrorInfo Class
 * @param {JSON} errorObj - received error JSON from Global-e
 * @returns {ErrorInfo} - Global-e ErrorInfo object
 */
function ErrorInfo(errorObj) {
    var errorInfo = Object.create(null);
    Object.defineProperties(errorInfo, {
        /**
         * Error code
         * @type {string}
         */
        Code: {
            enumerable: true,
            value: (errorObj.Code || null)
        },
        /**
         * Error message
         * @type {string}
         */
        Error: {
            enumerable: true,
            value: (errorObj.Error || null)
        },
        /**
         * Error description
         * @type {string}
         */
        Description: {
            enumerable: true,
            value: (errorObj.Description || null)
        },
        /**
         * Success
         * @type {boolean}
         */
        Success: {
            enumerable: true,
            value: (errorObj.Success || null)
        },
        /**
         * Reason description
         * @type {string}
         */
        Reason: {
            enumerable: true,
            value: (errorObj.Reason || null)
        }
    });
    return errorInfo;
}

module.exports = ErrorInfo;
