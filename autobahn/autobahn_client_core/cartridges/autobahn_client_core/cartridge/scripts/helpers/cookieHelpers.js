'use strict';
/* global response, request */
var Cookie = require('dw/web/Cookie');

var TPA_COOKIE_NAME = 'TPA';
var PAP_COOKIE_NAME = 'fsaAF';
var year = 31536000000;
var days30 = 2592000000;
var eightHours = 28800000;

/**
 * Sets cookie
 * @param {string} cookieName - cookie name
 * @param {string} cookieValue - cookie value
 * @param {number} maxAge - in seconds
 */
function setCookie(cookieName, cookieValue, maxAge) {
    maxAge = (empty(maxAge) ? 24 : maxAge); // eslint-disable-line no-param-reassign
    var cookie;
    if (!empty(cookieName) && !empty(cookieValue) && !empty(maxAge)) {
        // make sure we're not going to violate the api.cookie.maxValueLength - warnings start at 1,200
        var stringLimit = 1150;

        cookie = new Cookie(cookieName, cookieValue);
        cookie.setPath('/');
        if (cookieValue.length < stringLimit) {
            cookie.setMaxAge(maxAge);
        } else {
            cookie.setMaxAge(0);
        }
        response.addHttpCookie(cookie);
    } else if (!empty(cookieName) && empty(cookieValue) && !empty(maxAge)) {
        cookie = new Cookie(cookieName, cookieValue);
        cookie.setPath('/');
        cookie.setMaxAge(0);
        response.addHttpCookie(cookie);
    }
}

/**
 * Get cookie's value
 * @param {string} cookieName - cookie name
 * @param {?string} defaultValue - default value to return
 * @returns {?string} - cookie's value
 */
function getCookieValue(cookieName, defaultValue) {
    if (cookieName === PAP_COOKIE_NAME) {
        // The PAP cookie has unencoded spaces in the value which causes the built-in cookie method to truncate the value.
        // Get the value from the raw cookie header
        var headers = request.httpHeaders;
        var cookieHeader = headers.get("cookie");
        if (cookieHeader) {
            var cookies = cookieHeader.split("; ");
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var cookieStr = cookie.toString();
                var firstEqual = cookieStr.indexOf("=");
                var name = cookieStr.substring(0, firstEqual);
                var val = cookieStr.substr(firstEqual + 1);
                if (name === PAP_COOKIE_NAME) {
                    return val;
                }
            }
        }
    } else {
        var httpCookies = (!empty(request) && ('httpCookies' in request) ? request.httpCookies : {});
        if (!empty(httpCookies) && cookieName in httpCookies && !empty(httpCookies[cookieName].value)) {
            return httpCookies[cookieName].value;
        }
    }

    return defaultValue;
}
var cookieHelper =