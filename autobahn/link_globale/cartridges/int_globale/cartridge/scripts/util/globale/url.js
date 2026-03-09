'use strict';

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} parameters - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendParametersToURL(url, parameters) {
    var newUrl = url;

    newUrl += (newUrl.indexOf('?') > -1 ? '&' : '?') + Object.keys(parameters).map(function (key) {
        return key + '=' + encodeURIComponent(parameters[key]);
    }).join('&');

    return newUrl;
}

/**
 * @description Remove given parameter from queryString
 * @param {string} queryString given
 * @param {array} parameters to remove
 * @returns {string} queryString updated
 */
function removeParametersFromQueryString(queryString, parameters) {
    var qsParams = queryString && (typeof queryString === 'string') && queryString.length > 0 ? queryString.split('&') : [];
    var removedParams = parameters && Array.isArray(parameters) && parameters.length > 0 ? parameters : [];
    removedParams.forEach(function (param) {
        var prefix = encodeURIComponent(param) + '=';
        for (var i = qsParams.length; i-- > 0;) {
            if (qsParams[i].lastIndexOf(prefix, 0) !== -1) {
                qsParams.splice(i, 1);
            }
        }
    });
    return qsParams.join('&');
}

/**
 * URL parse
 * @param {string} str - Url to parse
 * @returns {Object|null} parsed URL
 */
function parseURL(str) {
    var regex = /^((\w+):)?(\/\/((\w+)?(:(\w+))?@)?([^/?:]+)(:(\d+))?)?(\/?([^/?#][^?#]*)?)?(\?([^#]+))?(#(\w*))?$/;
    var matches = str.match(regex);

    if (!matches) {
        return null;
    }

    var result = {
        url: matches[0],
        protocol: matches[2],
        username: matches[5],
        password: matches[7],
        host: matches[8] || '',
        port: matches[10],
        pathname: matches[11] || '',
        query: matches[14] || '',
        hash: matches[16] || ''
    };

    return result;
}

/**
 * Helper function for converting a queryString into an object
 * @param {string} queryString a query string
 * @returns {Object} deserialized object representation of the query string
 */
function deserializeQueryString(queryString) {
    var str = queryString.replace('?', '');
    var deserializedObject = {};
    var queryPairs = str.split('&');
    queryPairs.forEach(function (pair) {
        var parts = pair.split('=');
        var key = parts[0];
        var value = parts.length > 1 ? parts[1] : null;
        deserializedObject[key] = value;
    });

    return deserializedObject;
}

module.exports = {
    appendParametersToURL: appendParametersToURL,
    removeParametersFromQueryString: removeParametersFromQueryString,
    parseURL: parseURL,
    deserializeQueryString: deserializeQueryString
};
