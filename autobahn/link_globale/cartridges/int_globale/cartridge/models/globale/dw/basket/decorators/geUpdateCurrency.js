/* globals session */

'use strict';

/**
 * Updates currency
 * @param {string} currencyCode - currency code
 */
function geUpdateCurrency(currencyCode) {
    var Currency = require('dw/util/Currency');

    if (this.getCurrencyCode() !== currencyCode) {
        session.setCurrency(Currency.getCurrency(currencyCode));
        this.updateCurrency();
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geUpdateCurrency: {
            value: geUpdateCurrency
        }
    });
};
