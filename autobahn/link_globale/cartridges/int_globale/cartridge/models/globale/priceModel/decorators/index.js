'use strict';

module.exports = {
    base: require('*/cartridge/models/globale/priceModel/decorators/base'),
    fixedPriceBookPrice: require('*/cartridge/models/globale/priceModel/decorators/fixedPriceBookPrice'),
    priceBookPrice: require('*/cartridge/models/globale/priceModel/decorators/priceBookPrice'),
    priceTable: require('*/cartridge/models/globale/priceModel/decorators/priceTable'),
    price: require('*/cartridge/models/globale/priceModel/decorators/price'),
    priceBeforeRounding: require('*/cartridge/models/globale/priceModel/decorators/priceBeforeRounding'),
    minPrice: require('*/cartridge/models/globale/priceModel/decorators/minPrice'),
    maxPrice: require('*/cartridge/models/globale/priceModel/decorators/maxPrice'),
    minPriceBookPrice: require('*/cartridge/models/globale/priceModel/decorators/minPriceBookPrice'),
    maxPriceBookPrice: require('*/cartridge/models/globale/priceModel/decorators/maxPriceBookPrice'),
    priceRange: require('*/cartridge/models/globale/priceModel/decorators/priceRange')
};
