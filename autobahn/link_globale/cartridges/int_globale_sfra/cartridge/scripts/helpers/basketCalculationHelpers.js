'use strict';

var base = module.superModule;
var originalCalculateTaxes = base.calculateTaxes;

/**
 * Calculate sales taxes
 * @param {dw.order.Basket} basket - current basket
 * @returns {Object} - object describing taxes that needs to be applied
 */
function calculateTaxes(basket) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry')) {
        return originalCalculateTaxes(basket);
    }

    return require('*/cartridge/scripts/hooks/taxes').calculateTaxes(basket);
}

module.exports = base;
module.exports.calculateTaxes = calculateTaxes;
