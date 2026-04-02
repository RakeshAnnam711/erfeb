'use strict';

module.exports = function (object, promotion) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: promotion
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
