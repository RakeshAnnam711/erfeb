'use strict';

var processInclude = require('base/util');

var baseFiles = {
    detail: require('./product/detail'),
    addToCartStickyBar: require('./product/addToCartStickyBar')
};

$(document).ready(function () {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
