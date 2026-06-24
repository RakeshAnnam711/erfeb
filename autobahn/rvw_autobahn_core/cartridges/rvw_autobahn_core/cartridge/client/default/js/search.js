'use strict';

var processInclude = require('base/util');

var baseFiles = {
    search: require('./search/search'),
}

$(document).ready(function () {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

module.exports = {
    baseFiles
};
