'use strict';

var checkout = require('./checkout');
var commercepaymentsShipping = {
    methods : {}
};

commercepaymentsShipping.methods.shippingFormResponseExtension = function(defer, data) {
    checkout.methods.refreshPaymentMethodsOnBillingCountryChange(data, data.preShippingSubmitData.oldBillingCountry);
}

module.exports = commercepaymentsShipping;
