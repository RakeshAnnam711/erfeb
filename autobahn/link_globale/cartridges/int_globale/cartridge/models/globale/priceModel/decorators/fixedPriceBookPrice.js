'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getFixedPriceBookPrice: {
            value: function (isListPrice, qty) {
                var Money = require('dw/value/Money');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                var globaleSession = require('*/cartridge/models/globale/session');
                var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
                var fixedPrice = Money.NOT_AVAILABLE;
                var fixedPriceBookId = null;
                try {
                    // calculate fixed price
                    priceBookHelpers.applyFixedPriceBooks(function (isListPrice, qty) { // eslint-disable-line no-shadow
                        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                        var priceModel = this.product.getPriceModel();
                        if (qty && qty.value) {
                            fixedPrice = priceModel.getPrice(qty);
                        } else {
                            fixedPrice = priceModel.getPrice();
                        }
                        if (priceModel.priceInfo) {
                            fixedPriceBookId = priceModel.priceInfo.priceBook.ID;
                        }
                        if (isListPrice && fixedPrice.available && fixedPriceBookId) {
                            // List Price
                            var listPriceBook = require('dw/catalog/PriceBookMgr').getPriceBook(fixedPriceBookId);
                            listPriceBook = globaleHelpers.getRootPriceBook(listPriceBook);
                            if (qty && qty.value) {
                                fixedPrice = priceModel.getPriceBookPrice.call(priceModel, listPriceBook.ID, qty);
                            } else {
                                fixedPrice = priceModel.getPriceBookPrice.call(priceModel, listPriceBook.ID);
                            }
                        }
                    }.bind(this, isListPrice, qty));

                    return globaleMoney(
                        fixedPrice.valueOrNull,
                        globaleSession.get('geCurrency'),
                        fixedPrice,
                        fixedPrice.available,
                        ((fixedPrice.available && fixedPriceBookId) || null)
                    );
                } catch (e) {
                    this.logger.error('getFixedPriceBookPrice: {0}', this.logger.message(e));
                }

                return globaleMoney(
                    fixedPrice.valueOrNull,
                    globaleSession.get('geCurrency'),
                    fixedPrice,
                    fixedPrice.available,
                    ((fixedPrice.available && fixedPriceBookId) || null)
                );
            }
        }
    });
};
