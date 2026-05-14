'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        toFormattedString: {
            value: function () {
                var formattedPrice = 'N/A';

                try {
                    if (this.valueOrNull !== null) {
                        var priceFormatter = require('*/cartridge/scripts/factories/globale/priceFormatter')(this.value);
                        priceFormatter.currencySymbol = this.currency ? this.currency.custom.symbol : 'N/A';
                        priceFormatter.maxDecimalPlaces = this.currency ? this.currency.custom.maxDecimalPlaces : 0;
                        formattedPrice = priceFormatter.getFormattedPrice();
                    }
                } catch (e) {
                    this.logger.error('toFormattedString: {0}', this.logger.message(e));
                }
                return formattedPrice;
            }
        }
    });
};
