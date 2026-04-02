'use strict';

module.exports = function (object) {
    var Site = require('dw/system/Site');
    var StringUtils = require('dw/util/StringUtils');
    Object.defineProperties(object, {
        getFormattedPrice: {
            value: function () {
                var systemDecimalSeparator = StringUtils.formatNumber(0, '###0.0', Site.current.defaultLocale).indexOf('.') !== -1 ? '.' : ',';
                var systemThousandsSeparator = systemDecimalSeparator === '.' ? ',' : '\\.';
                var formattedPrice = this.price < 0 ? '-' : '';
                var numberFormat = this.getNumberFormat();
                var numericPrice = StringUtils.formatNumber(Math.abs(this.price), numberFormat, Site.current.defaultLocale);

                // replace default separators with "!" and "?"
                numericPrice = numericPrice.replace(new RegExp(systemThousandsSeparator, 'g'), '!').replace(systemDecimalSeparator, '?');

                // replace thousand and decimal separators with the configured
                var thousandSeparator = this.priceDisplayFormat.thousandSeparator !== null ? this.priceDisplayFormat.thousandSeparator : ',';
                var decimalSeparator = this.priceDisplayFormat.decimalSeparator !== null ? this.priceDisplayFormat.decimalSeparator : '.';
                numericPrice = numericPrice.replace(new RegExp('!', 'g'), thousandSeparator).replace('?', decimalSeparator); // eslint-disable-line prefer-regex-literals

                // apply currency formatting
                var placeCurrencySymbolBeforePrice = this.priceDisplayFormat.currencySymbolBeforePrice;
                var useCurrencySymbolSpace = this.priceDisplayFormat.currencySymbolSpace;

                if (placeCurrencySymbolBeforePrice) {
                    formattedPrice += this.currencySymbol;
                    formattedPrice += (useCurrencySymbolSpace ? ' ' : '');
                    formattedPrice += numericPrice;
                } else {
                    formattedPrice += numericPrice;
                    formattedPrice += (useCurrencySymbolSpace ? ' ' : '');
                    formattedPrice += this.currencySymbol;
                }

                return formattedPrice;
            }
        }
    });
};
