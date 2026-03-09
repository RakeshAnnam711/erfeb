'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'grandTotalValueOrNull', {
        enumerable: true,
        value: function(object, apiObject) {
            return apiObject.totalGrossPrice.valueOrNull;
        } (object, apiObject)
    })
}
