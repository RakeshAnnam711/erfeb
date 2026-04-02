'use strict';

module.exports = function(object, apiObject) {
    Object.defineProperty(object, 'balance', {
        enumerable: true,
        value: apiObject.balance.toFormattedString()
    });
};
