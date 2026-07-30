'use strict';

var globaleSession = require('*/cartridge/models/globale/session');

/**
 * Represents OrderCurrencyConfig
 * @constructor
 * @param {Object} config - config object
 */
function OrderCurrencyConfig(config) {
    /**
     * Returns Order Currency based on GE country
     * @returns {string} - Auto-Fail Orders Time
     */
    this.getOrderCurrency = function () {
        var geOrderCurrency = null;
        if (config && Object.keys(config).length > 0) {
            geOrderCurrency = Object.keys(config).find(function (key) {
                return config[key].indexOf(globaleSession.get('geCountry')) !== -1 ? config[key] : null;
            });
        }

        return geOrderCurrency;
    };
}

module.exports = OrderCurrencyConfig;
