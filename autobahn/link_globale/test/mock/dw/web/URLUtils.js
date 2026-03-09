'use strict';

var URL = require('./URL');

module.exports = {
    https: function (urlAction) {
        return new URL({
            protocol: 'https://',
            host: urlAction.host,
            path: [('/' + urlAction.siteId), urlAction.locale, urlAction.action].join('/')
        });
    }
};
