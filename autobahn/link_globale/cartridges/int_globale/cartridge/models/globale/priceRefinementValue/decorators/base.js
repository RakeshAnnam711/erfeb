'use strict';

module.exports = function (object, priceRefinementValue) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: priceRefinementValue
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
