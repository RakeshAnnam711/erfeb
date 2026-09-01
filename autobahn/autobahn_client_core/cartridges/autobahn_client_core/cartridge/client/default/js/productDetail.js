'use strict';

var processInclude = require('base/util');

var baseFiles = {
    detail: require('./product/detail'),
    addToCartStickyBar: require('core/product/addToCartStickyBar'),
    expressPayments: require('./product/expressPayments')
};

$(document).ready(function () {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
