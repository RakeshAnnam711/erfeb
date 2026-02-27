'use strict';

module.exports = function (object, originShippingMgr) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: (originShippingMgr || null)
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
