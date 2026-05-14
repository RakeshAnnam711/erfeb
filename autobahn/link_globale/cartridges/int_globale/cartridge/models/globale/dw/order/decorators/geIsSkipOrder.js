'use strict';

/**
 * Check is order should be skipped
 * @returns {boolean} - result of checking
 */
function geIsSkipOrder() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var result = false;

    var orderType = order.custom && order.custom[globaleHelpers.customAttr.order.geOrderType];
    if (
        orderType
        && (orderType.value === globaleHelpers.consts.typeMixedOrdersSubOrder
            || (orderType.value === globaleHelpers.consts.typeMixedOrdersMainOrder
                && order.custom[globaleHelpers.customAttr.order.geMixedOrdersSuccessfullyUpdated] === false))
    ) {
        result = true;
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geIsSkipOrder: {
            value: geIsSkipOrder
        }
    });
};
