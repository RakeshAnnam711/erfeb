'use strict';

module.exports = function (priceTable, priceModel) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry') || !priceTable) {
        return priceTable;
    }
    var decorators = require('*/cartridge/models/globale/priceTable/decorators/index');
    var object = Object.create(priceTable);
    decorators.base(object, priceTable, priceModel);
    try {
        decorators.price(object);
        decorators.percentage(object);
        decorators.quantities(object);
    } catch (e) {
        object.logger.error('PRICE_TABLE: {0}', object.logger.message(e));
    }
    return object;
};
