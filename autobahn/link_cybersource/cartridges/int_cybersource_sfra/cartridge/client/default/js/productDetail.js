'use strict';
console.log('productDetails.js-(cyb)');
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('core/product/detail'));
    processInclude(require('./product/detail'));
});
