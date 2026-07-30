/* globals response */

'use strict';

/**
 * Adds CORS headers to response
 */
function attachCORSHeaders() {
    var Response = require('dw/system/Response');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    response.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_ORIGIN, globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsBaseUrl));
    response.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_METHODS, '*');
    response.setHttpHeader(Response.ACCESS_CONTROL_ALLOW_HEADERS, 'Origin, X-Requested-With, Content-Type, Accept');
}

module.exports = {
    attachCORSHeaders: attachCORSHeaders
};
