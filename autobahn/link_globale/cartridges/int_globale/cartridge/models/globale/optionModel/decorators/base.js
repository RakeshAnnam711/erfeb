'use strict';

module.exports = function (object, optionModel) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: optionModel
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
