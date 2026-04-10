/* eslint-disable no-underscore-dangle */

'use strict';

module.exports = {
    locale: 'en_GB',
    httpRemoteAddress: null,
    httpHost: 'test-001.sandbox.us01.dx.commercecloud.salesforce.com',
    geolocation: {
        countryCode: 'GB'
    },
    httpHeaders: {
        _headers: {},
        get: function (key) {
            return (key in this._headers) ? this._headers[key] : null;
        },
        set: function (key, value) {
            this._headers[key] = value;
        }
    },
    httpParameters: {
        _httpParameters: {},
        get: function (key) {
            return (key in this._httpParameters) ? this._httpParameters[key] : null;
        },
        set: function (key, value) {
            this._httpParameters[key] = value;
        },
        remove: function (key) {
            delete this._httpParameters[key];
        }
    },
    httpParameterMap: {
        get: function (key) {
            return (key in this) ? this[key] : null;
        },
        set: function (key, value) {
            this[key] = value;
        },
        remove: function (key) {
            delete this[key];
        },
        isParameterSubmitted: function (key) {
            return (key in this);
        }
    },
    httpCookies: {
        dwsid: {
            value: 'dwsid'
        }
    }
};
