'use strict';

var processInclude = require('base/util');

/**
 * A list of base Files, leave these in order they are listed
 */
var baseFiles = {
    paymentInstruments: require('./paymentInstruments/paymentInstruments')
};

$(document).ready(function () {
    Object.keys(module.exports.baseFiles).forEach(function (key) {
        processInclude(module.exports.baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
