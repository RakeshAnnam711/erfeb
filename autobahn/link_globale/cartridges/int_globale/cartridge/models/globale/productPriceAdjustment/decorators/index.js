'use strict';

module.exports = {
    base: require('*/cartridge/models/globale/productPriceAdjustment/decorators/base'),
    applicable: require('*/cartridge/models/globale/productPriceAdjustment/decorators/applicable'),
    percentage: require('*/cartridge/models/globale/productPriceAdjustment/decorators/percentage'),
    amount: require('*/cartridge/models/globale/productPriceAdjustment/decorators/amount'),
    fixedPrice: require('*/cartridge/models/globale/productPriceAdjustment/decorators/fixedPrice'),
    totalFixedPrice: require('*/cartridge/models/globale/productPriceAdjustment/decorators/totalFixedPrice'),
    pricebookPrice: require('*/cartridge/models/globale/productPriceAdjustment/decorators/pricebookPrice'),
    bonusProduct: require('*/cartridge/models/globale/productPriceAdjustment/decorators/bonusProduct'),
    free: require('*/cartridge/models/globale/productPriceAdjustment/decorators/free'),
    price: require('*/cartridge/models/globale/productPriceAdjustment/decorators/price')
};
