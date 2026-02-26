'use strict';

function Money(isAvailable) {
    return {
        available: isAvailable,
        value: 10.99,
        getDecimalValue: function () { return 10.99; },
        getCurrencyCode: function () { return 'GBP'; }
    };
}

module.exports = Money;
