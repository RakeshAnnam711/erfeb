'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getNumberFormat: {
            value: function () {
                var numberFormat = '#,##0';
                if (this.maxDecimalPlaces > 0) {
                    numberFormat = '#,##0.';
                    for (let i = 0; i < this.maxDecimalPlaces; i++) {
                        numberFormat += '0';
                    }
                }

                return numberFormat;
            }
        }
    });
};
