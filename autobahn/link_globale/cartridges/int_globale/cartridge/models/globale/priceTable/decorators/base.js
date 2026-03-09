'use strict';

module.exports = function (object, priceTable, priceModel) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: priceTable
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        },
        priceModel: {
            enumerable: true,
            value: priceModel
        }
    });
};
