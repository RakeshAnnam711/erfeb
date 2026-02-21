'use strict';

module.exports = function (object, originalMoney) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: (originalMoney || null)
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
