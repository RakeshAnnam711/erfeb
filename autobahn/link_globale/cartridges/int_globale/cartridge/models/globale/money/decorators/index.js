'use strict';

module.exports = {
    base: require('*/cartridge/models/globale/money/decorators/base'),
    currency: require('*/cartridge/models/globale/money/decorators/currency'),
    fixedPrice: require('*/cartridge/models/globale/money/decorators/fixedPrice'),
    moneyValue: require('*/cartridge/models/globale/money/decorators/moneyValue'),
    valueOrNull: require('*/cartridge/models/globale/money/decorators/valueOrNull'),
    available: require('*/cartridge/models/globale/money/decorators/available'),
    decimalValue: require('*/cartridge/models/globale/money/decorators/decimalValue'),
    equals: require('*/cartridge/models/globale/money/decorators/equals'),
    value: require('*/cartridge/models/globale/money/decorators/value'),
    toString: require('*/cartridge/models/globale/money/decorators/toString'),
    toFormattedString: require('*/cartridge/models/globale/money/decorators/toFormattedString'),
    toNumberString: require('*/cartridge/models/globale/money/decorators/toNumberString'),
    compareTo: require('*/cartridge/models/globale/money/decorators/compareTo'),
    valueOf: require('*/cartridge/models/globale/money/decorators/valueOf'),
    newMoney: require('*/cartridge/models/globale/money/decorators/newMoney'),
    percent: require('*/cartridge/models/globale/money/decorators/percent'),
    add: require('*/cartridge/models/globale/money/decorators/add'),
    divide: require('*/cartridge/models/globale/money/decorators/divide'),
    multiply: require('*/cartridge/models/globale/money/decorators/multiply'),
    subtract: require('*/cartridge/models/globale/money/decorators/subtract')
};
