'use strict';

module.exports = function (price, productId, quantity, skipRounding, formatOnly, returnPriceObject, discount, giftCertificate) {
    var decorators = require('*/cartridge/models/globale/price/decorators/index');
    var object = Object.create(null);
    decorators.base(object, price, skipRounding, formatOnly, discount);
    try {
        decorators.product(object, productId);
        decorators.giftCertificate(object, giftCertificate);
        decorators.quantity(object, quantity);
        decorators.currencyRate(object);
        decorators.merchantTaxRate(object);
        decorators.countryVATRate(object);
        decorators.productClassCoefficientRate(object);
        decorators.coefficientRate(object);
        decorators.applyTaxVATCoefficients(object);
        decorators.roundPrice(object);
        decorators.vatRateType(object);
        decorators.price(object);
        if (returnPriceObject === true) {
            return object;
        }
        return object.getPrice();
    } catch (e) {
        object.logger.error('GLOBALE_PRICE: {0}', object.logger.message(e));
    }
    return (price || null);
};
