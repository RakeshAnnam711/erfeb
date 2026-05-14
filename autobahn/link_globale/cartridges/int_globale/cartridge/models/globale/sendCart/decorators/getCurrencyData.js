'use strict';

/**
 * Calculates Currency for Global-e SendCart API object
 * @param {dw.order.Basket} basket - SFCC basket
 * @returns {Object} - Global-e SendCart.Currency API object
 */
function getCurrencyData(basket) {
    var globaleSession = require('*/cartridge/models/globale/session');
    return {
        currencyCode: globaleSession.get('geCurrency'),
        originalCurrencyCode: basket.currencyCode
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCurrencyData', {
        value: getCurrencyData
    });
};
