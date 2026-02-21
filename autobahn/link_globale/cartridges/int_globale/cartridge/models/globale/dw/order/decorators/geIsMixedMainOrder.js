'use strict';

/**
 * Check is order main Mixed Order
 * @returns {boolean} - result of checking
 */
function geIsMixedMainOrder() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var result = false;

    if (
        order &&
        (globaleHelpers.customAttr.order.geOrderType in order.custom) &&
        order.custom[globaleHelpers.customAttr.order.geOrderType] &&
        order.custom[globaleHelpers.customAttr.order.geOrderType].value === globaleHelpers.consts.typeMixedOrdersMainOrder
    ) {
        result = true;
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geIsMixedMainOrder: {
            value: geIsMixedMainOrder
        }
    });
};
