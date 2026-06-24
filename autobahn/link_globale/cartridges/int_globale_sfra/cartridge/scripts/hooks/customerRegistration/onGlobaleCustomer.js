'use strict';

exports.customerVerification = function (jsonPayload) {
    var customerRegistrationHelpers = require('*/cartridge/scripts/helpers/customerRegistrationHelpers');
    return customerRegistrationHelpers.customerVerification(jsonPayload);
};

exports.customerRegistration = function (jsonPayload) {
    var customerRegistrationHelpers = require('*/cartridge/scripts/helpers/customerRegistrationHelpers');
    return customerRegistrationHelpers.customerRegistration(jsonPayload);
};
