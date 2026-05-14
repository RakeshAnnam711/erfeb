'use strict';

var Site = require('dw/system/Site');

var vertexLogger = require('*/cartridge/scripts/lib/generalLogger');
var moduleName = 'deleteRequest~';
/**
 * @returns {string} request origin data
 */
function getRequestOriginData() {
    return 'httpRemoteAddress: ' + request.httpRemoteAddress
           + ', httpUserAgent: ' + request.httpUserAgent
           + ', Headers: ' + request.httpHeaders.values().toArray().join(',');
}
/**
 *
 * @param {Object} body request body
 * @returns {Object} request parameters or null
 */
function getRequestParams(body) {
    var logLocation = moduleName + 'getRequestParams()';
    var params;

    try {
        params = JSON.parse(body);
    } catch (e) {
        vertexLogger.error(logLocation, 'JSON Parse error:' + e.message);
        vertexLogger.debug(logLocation, 'JSON Parse error:' + e.message, { body: body });
        return null;
    }
    // set limit on transaction id lentgh to prevent injections
    if (Object.prototype.hasOwnProperty.call(params, 'transaction') && Object.prototype.hasOwnProperty.call(params, 'source')) {
        return params;
    }

    vertexLogger.error(logLocation, 'Required parameters are missed: transaction, source' + getRequestOriginData());
    return null;
}

/**
 * Calculate a Hmac digest and encode it in Base64 String
 *
 * @param   {string} data data to calculate hmac for
 * @param   {string} stringKey secret key for calculating digest
 * @returns {string} Base64 encoded string of data digest
 */
function calculateHmac(data, stringKey) {
    var bytesKey;
    var macSha256;
    var signature;
    var signatureBytes;

    var Mac = require('dw/crypto/Mac');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');

    macSha256 = new Mac(Mac.HMAC_SHA_256);
    bytesKey = new Bytes(stringKey);

    signatureBytes = macSha256.digest(data, bytesKey);
    signature = Encoding.toHex(signatureBytes);

    return signature;
}

/**
 * @description Checks the HMAC
 * @param {Object} body body of request
 * @returns {boolean} true if HMAC is correct
 */
function isCorrectHMAC(body) {
    var logLocation = moduleName + 'isCorrectHMAC()';
    var requestHmac;
    var hmacKey;
    var calculatedHmac;

    requestHmac = request.getHttpHeaders().get('x-vertex-hmac'); // value or null

    if (requestHmac === null) {
        vertexLogger.error(logLocation, 'HMAC header is absent: \'x-vertex-hmac\' not in the request headers');
        vertexLogger.debug(logLocation, 'HMAC header is absent: \'x-vertex-hmac\' not in the request headers', { RequestData: getRequestOriginData() });
        return false;
    }

    hmacKey = Site.getCurrent().preferences.custom.Vertex_RemoteRequestToken;
    calculatedHmac = calculateHmac(body, hmacKey);

    if (calculatedHmac === requestHmac) {
        return true;
    }

    vertexLogger.error(logLocation, 'HMAC validation failed: calculated value is different from \'x-vertex-mac\' request header');
    vertexLogger.debug(logLocation, 'HMAC validation failed: calculated value is different from \'x-vertex-mac\' request header.', { RequestData: getRequestOriginData(), CalculatedHMAC: calculatedHmac, RequestBody: body });

    return false;
}
/**
 * @description validate Request Parameters
 * @returns {Object} Status
 *
 */
function validateRequestParameters() {
    var logLocation = moduleName + 'validateRequestParameters()';
    var validationStatus = {
        ok         : false,
        message    : '',
        httpStatus : 400 // yes, we expect the worst things to happen by default :)
    };
    var requestBody;
    var requestParams;

    requestBody = request.httpParameterMap.getRequestBodyAsString(); // can be empty

    if (!empty(requestBody)) {
        if (isCorrectHMAC(requestBody)) {
            requestParams = getRequestParams(requestBody);
            if (requestParams !== null) {
                validationStatus.ok = true;
                validationStatus.httpStatus = 200;
                validationStatus.transaction = requestParams.transaction;
                validationStatus.source = requestParams.source;
            } else {
                validationStatus.message = 'We could not process your request: transaction id is absent';
            }
        } else {
            validationStatus.message = 'We could not process your request: authentication failed';
            validationStatus.httpStatus = 401;
        }
    } else {
        validationStatus.message = 'We could not process your request: request body is empty';
        vertexLogger.error(logLocation, 'Request body is empty.');
        vertexLogger.debug(logLocation, 'Request body is empty.', { RequestData: getRequestOriginData() });
    }

    return validationStatus;
}

exports.validateRequestParameters = validateRequestParameters;
