'use strict';

module.exports = {
    base: require('*/cartridge/models/globale/price/decorators/base'),
    product: require('*/cartridge/models/globale/price/decorators/product'),
    quantity: require('*/cartridge/models/globale/price/decorators/quantity'),
    currencyRate: require('*/cartridge/models/globale/price/decorators/currencyRate'),
    merchantTaxRate: require('*/cartridge/models/globale/price/decorators/merchantTaxRate'),
    countryVATRate: require('*/cartridge/models/globale/price/decorators/countryVATRate'),
    productClassCoefficientRate: require('*/cartridge/models/globale/price/decorators/productClassCoefficientRate'),
    coefficientRate: require('*/cartridge/models/globale/price/decorators/coefficientRate'),
    applyTaxVATCoefficients: require('*/cartridge/models/globale/price/decorators/applyTaxVATCoefficients'),
    roundPrice: require('*/cartridge/models/globale/price/decorators/roundPrice'),
    vatRateType: require('*/cartridge/models/globale/price/decorators/vatRateType'),
    price: require('*/cartridge/models/globale/price/decorators/price'),
    giftCertificate: require('*/cartridge/models/globale/price/decorators/giftCertificate')
};
