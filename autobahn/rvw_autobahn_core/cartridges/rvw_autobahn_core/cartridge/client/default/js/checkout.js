'use strict';

var processInclude = require('base/util');

/**
 * A list of base Files, leave these in order they are listed
 */
var baseFiles = {
    checkout: require('./checkout/checkout')
};

$(document).ready(function () {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
