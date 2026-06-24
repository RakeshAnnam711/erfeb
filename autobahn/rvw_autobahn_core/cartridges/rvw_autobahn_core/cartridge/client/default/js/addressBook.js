'use strict';

var processInclude = require('base/util');

var baseFiles = {
    addressBook: require('./addressBook/addressBook')
};

function loadFunctions() {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
}

$(document).ready(function () {
    loadFunctions();
});

module.exports = {
    baseFiles
};
