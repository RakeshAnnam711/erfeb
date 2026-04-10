'use strict';

module.exports = {
    base: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/base'),
    applicable: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/applicable'),
    percentage: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/percentage'),
    amount: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/amount'),
    bonusProduct: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/bonusProduct'),
    price: require('*/cartridge/models/globale/orderPriceAdjustment/decorators/price')
};
