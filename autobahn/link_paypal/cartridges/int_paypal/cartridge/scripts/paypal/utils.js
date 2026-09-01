'use strict';

const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');
const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');

const paypalConstants = require('*/cartridge/config/constants');

let paypalLogger;

/**
 * Gets client id from cache if it exists or creates it, saves to cache and returns from cache
 *
 * @returns {string} with client id
 */
function getClientId() {
    const serviceName = 'int_paypal.http.rest';
    const restService = require('dw/svc/LocalServiceRegistry').createService(serviceName, {});

    // Returns client ID
    return restService.configuration.credential.user;
}

/**
 * Encodes purchase unit object into encoded string
 *
 * @param {Object} purchaseUnit purchase unit
 * @returns {string} encoded string
 */
function encodeString(purchaseUnit) {
    const bytes = new Bytes(JSON.stringify(purchaseUnit));

    return Encoding.toBase64(bytes);
}

/**
 * Get logger instance
 *
 * @param {string} err Error message
 */
function createErrorLog(err) {
    paypalLogger = paypalLogger || Logger.getLogger(paypalConstants.PAYPAL_FILE_NAME_PREFIX, paypalConstants.PAYPAL_CATEGORY);

    if (!empty(err)) {
        paypalLogger.error(err.stack ? (err.message + err.stack) : err);
    } else {
        paypalLogger.debug(Resource.msg('paypal.debug.log.empty.log.entry', 'paypalerrors', null));
    }
}

/**
 * Creates a debug log message
 * @param {string} err Error message
 * @returns {void}
 */
function createDebugLog(err) {
    paypalLogger = paypalLogger || Logger.getLogger(paypalConstants.PAYPAL_FILE_NAME_PREFIX, paypalConstants.PAYPAL_CATEGORY);
    paypalLogger.debug(err);
}

/**
 * Creates the Error Message
 *
 * @param {string} errorName error message name
 * @returns {string} errorMsg - Resource error massage
 */
function createErrorMsg(errorName) {
    const defaultMessage = Resource.msg('paypal.error.general', 'paypalerrors', null);

    if (typeof errorName === 'string') {
        return Resource.msg('paypal.error.' + errorName.replace(/_/g, '.'), 'paypalerrors', defaultMessage);
    }

    return defaultMessage;
}

/**
 * The function to proceed a safe JSON parsing.
 * @param {string} element - The string what should be parsed.
 * @returns {Object} - the result of parsing.
 */
function tryParseJSON(element) {
    let result;

    try {
        result = JSON.parse(element);
    } catch (error) {
        createErrorLog(['Unable to parse:  ', element, error.stack].join(' '));
    }

    return result;
}

/**
 * Adds custom attribute FlashMessages to a system object
 * @param {Object} systemObject System object for which custom attribute should be created
 * @param {string} messageText Resource key
 * @param {string} messageType Type of message, i.e. danger, info or warning
 * @returns {void}
 */
function addFlashMessagesCustomAttribute(systemObject, messageText, messageType) {
    const flashMessages = systemObject.custom.flashMessages ? tryParseJSON(systemObject.custom.flashMessages) : [];

    flashMessages.push({
        text: messageText,
        type: messageType
    });

    systemObject.custom.flashMessages = JSON.stringify(flashMessages);
}

/**
 * Gets the user agent string from the request headers
 * @returns {string} User agent string
 */
function getUserAgent() {
    return request.httpHeaders.get('user-agent') || '';
}

/**
 * Reverses a string
 * @param {string} str - The string to reverse
 * @returns {string} The reversed string
 */
function reverseString(str) {
    return str.split('').reverse().join('');
}

/**
 * Checks if the user agent in the URL does not match the current user agent
 * @returns {boolean} True if the user agent in the URL does not match the current user agent
 */
function isNotSameUserAgent() {
    const StringUtils = require('dw/util/StringUtils');

    const userAgent = getUserAgent();
    const urlParamValue = request.httpParameterMap.uaRef.stringValue;

    if (!userAgent || !urlParamValue) {
        return false;
    }

    return StringUtils.decodeBase64(reverseString(urlParamValue)) !== userAgent;
}

module.exports = {
    getClientId: getClientId,
    createErrorLog: createErrorLog,
    encodeString: encodeString,
    createErrorMsg: createErrorMsg,
    createDebugLog: createDebugLog,
    tryParseJSON: tryParseJSON,
    getUserAgent: getUserAgent,
    reverseString: reverseString,
    isNotSameUserAgent: isNotSameUserAgent,
    addFlashMessagesCustomAttribute: addFlashMessagesCustomAttribute
};
