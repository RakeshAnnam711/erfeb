'use strict';

module.exports = function (price) {
    var decorators = require('*/cartridge/models/globale/priceFormatter/decorators/index');
    var object = Object.create(null);
    decorators.base(object, price);
    try {
        decorators.numberFormat(object);
        decorators.formattedPrice(object);
    } catch (e) {
        object.logger.error('GLOBALE_PRICE: {0}', object.logger.message(e));
    }
    return object;
};
