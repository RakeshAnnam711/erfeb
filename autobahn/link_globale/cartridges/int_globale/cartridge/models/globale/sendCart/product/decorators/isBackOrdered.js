'use strict';

/**
 * Returns Global-e Product.IsBackOrdered API
 * @returns {string|null} - Global-e Product.IsBackOrdered value
 */
function getIsBackOrdered() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getPliIsBackOrdered, this.productLineItem) || false;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getIsBackOrdered', {
        value: getIsBackOrdered
    });
};
