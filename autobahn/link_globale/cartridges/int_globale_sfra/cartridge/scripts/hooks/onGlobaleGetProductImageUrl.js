'use strict';

exports.getProductImageUrl = function (product) {
    var globaleProductHelpers = require('*/cartridge/scripts/helpers/globaleProductHelpers.js');
    return globaleProductHelpers.getProductImageUrl(product);
};
