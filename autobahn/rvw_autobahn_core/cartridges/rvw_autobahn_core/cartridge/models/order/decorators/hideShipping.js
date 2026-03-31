'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
module.exports = function (object, apiObject, view) {
    Object.defineProperty(object, 'hideShipping', {
        enumerable: true,
        value: function(object, apiObject) {
            return COHelpers.hideShipping(apiObject);
        } (object, apiObject, view)
    })
}
