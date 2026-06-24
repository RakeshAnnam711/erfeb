'use strict';

function isCurrencyExists(currencyCode) {
    return ['GBP', 'USD', 'CAD', 'AUD'].indexOf(currencyCode) !== -1;
}

module.exports = {
    isCurrencyExists: isCurrencyExists
};
