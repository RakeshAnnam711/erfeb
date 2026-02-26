'use strict';

module.exports = function (object, fixedPrice, fixedPriceBookId) {
    Object.defineProperties(object, {
        fixedPrice: {
            enumerable: true,
            value: (fixedPrice || false)
        },
        fixedPriceBookId: {
            enumerable: true,
            value: (fixedPriceBookId || null)
        }
    });
};
