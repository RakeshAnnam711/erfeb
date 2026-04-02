'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'productQuantityTotal', {
        enumerable: true,
        value: object.productQuantityTotal || 0
    })
}
