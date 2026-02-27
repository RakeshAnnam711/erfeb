'use strict';

module.exports = function (object, apiBasket, apiCustomer, countryCode) {
    Object.defineProperty(object, 'currencyCode', {
        enumerable: true,
        value: function(object, apiBasket, apiCustomer, countryCode) {
            return apiBasket.currencyCode;
        } (object, apiBasket, apiCustomer, countryCode)
    })
}
