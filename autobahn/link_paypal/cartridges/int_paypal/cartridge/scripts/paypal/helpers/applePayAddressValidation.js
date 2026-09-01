'use strict';

const Resource = require('dw/web/Resource');

const errorCodes = {
    shippingErrorCode: 'shippingContactInvalid',
    billingErrorCode: 'billingContactInvalid'
};

const errorMessages = {
    phoneNumberError: Resource.msg('applepay.error.phoneNumberError', 'locale', null),
    emailError: Resource.msg('applepay.error.emailError', 'locale', null),
    nameError: Resource.msg('applepay.error.nameError', 'locale', null),
    addressLinesError: Resource.msg('applepay.error.addressLinesError', 'locale', null),
    localityError: Resource.msg('applepay.error.localityError', 'locale', null),
    postalCodeError: Resource.msg('applepay.error.postalCodeError', 'locale', null),
    countryError: Resource.msg('applepay.error.countryError', 'locale', null),
    countryCodeError: Resource.msg('applepay.error.countryCodeError', 'locale', null)
};

const contactFields = {
    phoneNumber: 'phoneNumber',
    email: 'emailAddress',
    name: 'name',
    postalCode: 'postalCode',
    addressLines: 'addressLines',
    country: 'country',
    countryCode: 'countryCode',
    locality: 'locality'
};

// Regular expressions for US locale
const regexps = {
    shipping: {
        cityRegex: /^[a-zA-Z\s]+$/,
        nameRegex: /^[a-zA-Z\s]+$/,
        postalCodeRegex: /^\d{5}(-\d{4})?$/,
        addressLineRegex: /^[a-zA-Z0-9\s,.-]*$/
    },
    billing: {
        nameRegex: /^[a-zA-Z\s]+$/,
        phoneRegex: /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        cityRegex: /^[a-zA-Z\s]+$/,
        postalCodeRegex: /^\d{5}(-\d{4})?$/,
        addressLineRegex: /^[a-zA-Z0-9\s,.-]*$/
    }
};

const shippingValidation = {
    validateName: function(name) {
        return regexps.shipping.nameRegex.test(name);
    },
    validateAddressLines: function(addressLines) {
        return regexps.shipping.addressLineRegex.test(addressLines);
    },
    validateLocality: function(locality) {
        return regexps.shipping.cityRegex.test(locality);
    },
    validatePostalCode: function(postalCode) {
        return regexps.shipping.postalCodeRegex.test(postalCode);
    },
    validateCountryCode: function(countryCode) {
        return countryCode === 'US';
    },
    validatePhoneNumber: function(phoneNumber) {
        return regexps.billing.phoneRegex.test(phoneNumber);
    },
    validateEmail: function(email) {
        return regexps.billing.emailRegex.test(email);
    }
};

const billingValidation = {
    validateName: function(name) {
        return regexps.billing.nameRegex.test(name);
    },
    validateAddressLines: function(addressLines) {
        return regexps.billing.addressLineRegex.test(addressLines);
    },
    validateLocality: function(locality) {
        return regexps.billing.cityRegex.test(locality);
    },
    validatePostalCode: function(postalCode) {
        return regexps.billing.postalCodeRegex.test(postalCode);
    },
    validateCountryCode: function(countryCode) {
        return countryCode === 'US';
    }
};

/**
* Validates Shipping Address in Apple Pay pop-up
* @param {Object} address Apple Pay Shipping Address
* @returns {Array} Array with address errors
*/
function validateShippingAddress(address) {
    const errors = [];

    if (!shippingValidation.validateLocality(address.city)) {
        errors.push({
            errorCode: errorCodes.shippingErrorCode,
            contactField: contactFields.locality,
            errorMessage: errorMessages.localityError
        });
    }

    if (!shippingValidation.validatePostalCode(address.postalCode)) {
        errors.push({
            errorCode: errorCodes.shippingErrorCode,
            contactField: contactFields.postalCode,
            errorMessage: errorMessages.postalCodeError
        });
    }

    if (!shippingValidation.validateCountryCode(address.countryCode)) {
        errors.push({
            errorCode: errorCodes.shippingErrorCode,
            contactField: contactFields.countryCode,
            errorMessage: errorMessages.countryCodeError
        });
    }

    return {
        error: errors.length !== 0,
        errors: errors
    };
}

/**
* Validates Billing Address and some Shipping Address fields in Apple Pay pop-up
* @param {Object} billingAddress Apple Pay Billing Address
* @param {Object} shippingAddress Apple Pay Shipping Address
* @returns {Array} Array with address errors
*/
function validateAddress(billingAddress, shippingAddress) {
    const errors = [];

    if (shippingAddress) {
        if (!shippingValidation.validateName(shippingAddress.name)) {
            errors.push({
                errorCode: errorCodes.shippingErrorCode,
                contactField: contactFields.name,
                errorMessage: errorMessages.nameError

            });
        }

        if (!shippingValidation.validateAddressLines(shippingAddress.addressLines)) {
            errors.push({
                errorCode: errorCodes.shippingErrorCode,
                contactField: contactFields.addressLines,
                errorMessage: errorMessages.addressLinesError

            });
        }
    }

    if (!shippingValidation.validatePhoneNumber(billingAddress.phoneNumber)) {
        errors.push({
            errorCode: errorCodes.shippingErrorCode,
            contactField: contactFields.phoneNumber,
            errorMessage: errorMessages.phoneNumberError
        });
    }

    if (!shippingValidation.validateEmail(billingAddress.email)) {
        errors.push({
            errorCode: errorCodes.shippingErrorCode,
            contactField: contactFields.email,
            errorMessage: errorMessages.emailError
        });
    }

    if (!billingValidation.validateName(billingAddress.name)) {
        errors.push({
            errorCode: errorCodes.billingErrorCode,
            contactField: contactFields.name,
            errorMessage: errorMessages.nameError

        });
    }

    if (!billingValidation.validateAddressLines(billingAddress.addressLines)) {
        errors.push({
            errorCode: errorCodes.billingErrorCode,
            contactField: contactFields.addressLines,
            errorMessage: errorMessages.addressLinesError

        });
    }

    if (!billingValidation.validateLocality(billingAddress.locality)) {
        errors.push({
            errorCode: errorCodes.billingErrorCode,
            contactField: contactFields.locality,
            errorMessage: errorMessages.localityError
        });
    }

    if (!billingValidation.validatePostalCode(billingAddress.postalCode)) {
        errors.push({
            errorCode: errorCodes.billingErrorCode,
            contactField: contactFields.postalCode,
            errorMessage: errorMessages.postalCodeError
        });
    }

    if (!billingValidation.validateCountryCode(billingAddress.countryCode)) {
        errors.push({
            errorCode: errorCodes.billingErrorCode,
            contactField: contactFields.countryCode,
            errorMessage: errorMessages.countryCodeError

        });
    }

    return {
        error: errors.length !== 0,
        errors: errors
    };
}

module.exports = {
    validateShippingAddress: validateShippingAddress,
    validateAddress: validateAddress
};
