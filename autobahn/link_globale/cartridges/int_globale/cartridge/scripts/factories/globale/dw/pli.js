'use strict';

module.exports = {
    /**
     * Returns Global-e product line item.
     *
     * @param {dw.order.ProductLineItem} pli - The product line item.
     * @throws {Error} - If the product line item is null.
     * @return {Object} - The Global-e product line item.
     */
    get: function (pli) {
        if (!pli) {
            throw Error('Product line item shouldn\'t be null');
        }

        var gePli = Object.create(pli);
        var decorators = require('*/cartridge/models/globale/dw/pli/decorators/index');
        decorators.geGetProductCode(gePli);

        return gePli;
    }
};
