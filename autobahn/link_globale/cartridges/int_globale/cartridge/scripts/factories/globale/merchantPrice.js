'use strict';

module.exports = function () {
    var decorators = require('*/cartridge/models/globale/price/decorators/index');
    var object = Object.create(null);
    decorators.currencyRate(object);

    return object;
};
