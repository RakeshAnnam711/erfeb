'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        toNumberString: {
            value: function () {
                var StringUtils = require('dw/util/StringUtils');
                var globaleRequest = require('*/cartridge/models/globale/request');
                var formattedPrice = 'N/A';
                var numberFormat = '#,##0';
                try {
                    if (this.valueOrNull !== null) {
                        formattedPrice = '';
                        if (this.value < 0) {
                            formattedPrice += '-';
                        }
                        if (this.currency) {
                            if (this.currency.custom.maxDecimalPlaces > 0) {
                                numberFormat = '#,##0.';
                                for (let i = 0; i < this.currency.custom.maxDecimalPlaces; i++) {
                                    numberFormat += '0';
                                }
                            }
                        }
                        formattedPrice += StringUtils.formatNumber(Math.abs(this.value), numberFormat, (globaleRequest.get('locale') || 'en_US'));
                    }
                } catch (e) {
                    this.logger.error('toNumberString: {0}', this.logger.message(e));
                }
                return formattedPrice;
            }
        }
    });
};
