'use strict';

var base = module.superModule;
var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

module.exports = function (object, apiProduct, type) {
    base.call(this, object, apiProduct, type);

    // WGACA MODIFICATION - Use custom PDP info defined in autobahn_client_core
    // Object.defineProperty(object, 'gtmData', {
    //     enumerable: true,
    //     value: gtmHelpers.getProductObject(apiProduct)
    // });
    // END MODIFICATION
};
