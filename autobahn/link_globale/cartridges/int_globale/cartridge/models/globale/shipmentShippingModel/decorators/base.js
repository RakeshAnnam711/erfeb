'use strict';

module.exports = function (object, originShipmentShippingModel) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: (originShipmentShippingModel || null)
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
