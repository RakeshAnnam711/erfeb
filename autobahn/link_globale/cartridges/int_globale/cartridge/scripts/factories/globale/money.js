'use strict';

module.exports = function (moneyValue, currencyCode, originalMoney, fixedPrice, fixedPriceBookId) {
    var decorators = require('*/cartridge/models/globale/money/decorators/index');
    var object = Object.create((originalMoney || null));
    decorators.base(object, originalMoney);
    try {
        decorators.currency(object, currencyCode);
        decorators.fixedPrice(object, fixedPrice, fixedPriceBookId);
        decorators.moneyValue(object);
        decorators.valueOrNull(object, moneyValue);
        decorators.available(object);
        decorators.decimalValue(object);
        decorators.equals(object);
        decorators.value(object);
        decorators.toString(object);
        decorators.toFormattedString(object);
        decorators.toNumberString(object);
        decorators.compareTo(object);
        decorators.valueOf(object);
        decorators.newMoney(object);
        decorators.percent(object);
        decorators.add(object);
        decorators.divide(object);
        decorators.multiply(object);
        decorators.subtract(object);
    } catch (e) {
        object.logger.error('GLOBALE_MONEY: {0}', object.logger.message(e));
    }
    return object;
};
