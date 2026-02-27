'use strict';

/**
 * Check is order main Mixed Order
 * @returns {boolean} - result of checking
 */
function geIsGeOrder() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var result = false;

    if (
        order
        && (globaleHelpers.customAttr.order.geOrderNumber in order.custom)
        && order.custom[globaleHelpers.customAttr.order.geOrderNumber]
    ) {
        result = true;
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geIsGeOrder: {
            value: geIsGeOrder
        }
    });
};
