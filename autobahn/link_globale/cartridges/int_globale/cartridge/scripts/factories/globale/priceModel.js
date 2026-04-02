'use strict';

module.exports = function (priceModel, product, currentOptionModel, splitOptions) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry') || !priceModel) {
        return priceModel;
    }
    var decorators = require('*/cartridge/models/globale/priceModel/decorators/index');
    var object = Object.create(priceModel);
    decorators.base(object, priceModel, product, currentOptionModel, splitOptions);
    try {
        decorators.fixedPriceBookPrice(object);
        decorators.priceBookPrice(object);
        decorators.priceTable(object);
        decorators.price(object);
        decorators.priceBeforeRounding(object);
        decorators.minPrice(object);
        decorators.maxPrice(object);
        decorators.minPriceBookPrice(object);
        decorators.maxPriceBookPrice(object);
        decorators.priceRange(object);
    } catch (e) {
        object.logger.error('PRICE_MODEL: {0}', object.logger.message(e));
    }
    return object;
};
