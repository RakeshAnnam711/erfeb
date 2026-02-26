'use strict';

module.exports = function (object) {
    var gePriceTable;
    Object.defineProperties(object, {
        getPriceTable: {
            value: function () {
                var priceTable = this.super.getPriceTable.apply(this.super, Array.prototype.slice.call(arguments));
                try {
                    return (require('*/cartridge/scripts/factories/globale/priceTable'))(priceTable, this);
                } catch (e) {
                    this.logger.error('getPriceTable: {0}', this.logger.message(e));
                }
                return priceTable;
            }
        },
        priceTable: {
            enumerable: true,
            get: function () {
                if (!gePriceTable) {
                    gePriceTable = this.getPriceTable();
                }
                return gePriceTable;
            }
        }
    });
};
