/* globals request */

'use strict';

module.exports = {
    /**
     * Retrieves the value of given key from Current Request object
     * @param {string} key - Current Request key
     * @returns {Object|string|null} - The value from Current Request
     */
    get: function (key) {
        return request[key];
    },
    /**
     * Sets the value to given request key
     * @param {string} key - Request Key
     * @param {string|null} value - Request Value
     */
    set: function (key, value) {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            request[key] = value;
        });
    },
    /**
     * Returns "dwsid" cookie value
     * @returns {string|null} - "dwsid" cookie value
     */
    getDwSidValue: function () {
        var dwsidCookie = request.httpCookies.dwsid;
        var dwSidCookieValue = null;
        if (dwsidCookie && ('value' in dwsidCookie)) {
            dwSidCookieValue = dwsidCookie.value;
        }
        return dwSidCookieValue;
    },
    /**
     * Returns request URL
     * @returns {string} - request URL
     */
    getRequestUrl: function () {
        return request.httpProtocol + '://' + request.httpHost + request.httpPath + (request.httpQueryString ? '?' + request.httpQueryString : '');
    },
    /**
     * Returns request endpoint
     * @returns {string} - request endpoint
     */
    getRequestEndpoint: function () {
        var pathParts = request.httpPath.split('/');
        return pathParts[pathParts.length - 1];
    }
};
