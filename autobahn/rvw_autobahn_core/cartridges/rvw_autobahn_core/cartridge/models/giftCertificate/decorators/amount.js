'use strict';

module.exports = function(object, apiObject) {
    Object.defineProperty(object, 'amount', {
        enumerable: true,
        value: apiObject.amount.toFormattedString()
    });
};
