'use strict';

module.exports = function (object, promotionPlan) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    Object.defineProperties(object, {
        super: {
            enumerable: true,
            value: promotionPlan
        },
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        }
    });
};
