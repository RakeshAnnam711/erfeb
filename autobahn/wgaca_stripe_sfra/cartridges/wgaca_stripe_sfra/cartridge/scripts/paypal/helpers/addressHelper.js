'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var basicHelpers = require('*/cartridge/scripts/util/basicHelpers');

var base = module.superModule;
var baseUpdateOrderBillingAddress = base.updateOrderBillingAddress;

/**
 * Normalizes PayPal phone values to reduce false negatives from local form regex.
 * @param {string} phone Phone value from PayPal payload
 * @param {string} countryCode ISO country code
 * @returns {string} normalized phone
 */
function normalizePhone(phone, countryCode) {
    var value = phone ? String(phone) : '';

    if (!value) {
        return '';
    }

    var digits = value.replace(/\D/g, '');

    // US payloads often include +1; keep local 10-digit format for form validation.
    if (countryCode === 'US' && digits.length === 11 && digits.charAt(0) === '1') {
        return digits.substring(1);
    }

    return digits || value;
}

/**
 * Returns formatted phone number from PayPal phone_number object.
 * @param {Object} phoneNumber PayPal phone number object
 * @returns {string} Formatted phone number
 */
function formatPhoneNumberWithCountryCode(phoneNumber) {
    if (!phoneNumber) {
        return '';
    }

    var countryCode = phoneNumber.country_code ? ['+', phoneNumber.country_code].join('') : '';
    return [countryCode, phoneNumber.national_number || ''].join('');
}

/**
 * Resolves shipping phone from multiple PayPal payload shapes.
 * @param {Object} shippingInfo PayPal shipping payload
 * @param {string} existingPhone Existing basket shipping phone
 * @returns {string} Best available phone value
 */
function resolveShippingPhone(shippingInfo, existingPhone) {
    var nestedPhone = basicHelpers.getValueByKey(shippingInfo, 'phone.phone_number.national_number', '');
    var rootPhone = basicHelpers.getValueByKey(shippingInfo, 'phone_number.national_number', '');
    var rootPhoneWithCountry = formatPhoneNumberWithCountryCode(shippingInfo && shippingInfo.phone_number);

    return nestedPhone || rootPhone || rootPhoneWithCountry || existingPhone || '';
}

/**
 * Normalizes state input to an ISO-like region code when possible.
 * @param {string} state Raw state value
 * @param {string} countryCode ISO country code
 * @returns {string} state code value
 */
function normalizeStateCode(state, countryCode) {
    var value = state ? String(state).trim() : '';
    var usStateNameToCode;

    if (!value) {
        return '';
    }

    if (value.length === 2) {
        return value.toUpperCase();
    }

    if (countryCode !== 'US') {
        return value;
    }

    usStateNameToCode = {
        alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
        connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
        illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
        maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
        missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
        'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
        oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA',
        washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
        'district of columbia': 'DC'
    };

    return usStateNameToCode[value.toLowerCase()] || value;
}

/**
 * Fills empty shipping fields from basket shipping address.
 * @param {Object} shippingData Address payload to validate
 * @returns {Object} merged shipping payload
 */
function mergeMissingFromBasketShipping(shippingData) {
    var basket = BasketMgr.getCurrentBasket();
    var shipment = basket && basket.defaultShipment;
    var basketShipping = shipment && shipment.shippingAddress;

    if (!basketShipping) {
        return shippingData;
    }

    shippingData.firstName = shippingData.firstName || basketShipping.firstName || '';
    shippingData.lastName = shippingData.lastName || basketShipping.lastName || '';
    shippingData.address1 = shippingData.address1 || basketShipping.address1 || '';
    shippingData.address2 = shippingData.address2 || basketShipping.address2 || '';
    shippingData.city = shippingData.city || basketShipping.city || '';
    shippingData.postalCode = shippingData.postalCode || basketShipping.postalCode || '';
    shippingData.countryCode = shippingData.countryCode || (basketShipping.countryCode && basketShipping.countryCode.value) || '';
    shippingData.stateCode = shippingData.stateCode || basketShipping.stateCode || '';
    shippingData.phone = shippingData.phone || basketShipping.phone || '';

    return shippingData;
}

/**
 * Fills missing name fields with safe placeholders when payer name is absent.
 * @param {Object} shippingData Address payload to validate
 * @param {string} emailValue Payer email
 * @returns {Object} shipping payload with names
 */
function ensureNameFallback(shippingData, emailValue) {
    var localPart = emailValue && emailValue.indexOf('@') > 0 ? emailValue.split('@')[0] : '';

    if (!shippingData.firstName) {
        shippingData.firstName = 'PayPal';
    }

    if (!shippingData.lastName) {
        shippingData.lastName = localPart || 'Customer';
    }

    return shippingData;
}

/**
 * Removes known non-shipping blockers from validation result map.
 * @param {Object} fields Form error map
 * @returns {Object} filtered form error map
 */
function dropNonShippingErrors(fields) {
    var filtered = {};

    Object.keys(fields || {}).forEach(function(key) {
        var lowerKey = key.toLowerCase();
        var isPhoneField = lowerKey.indexOf('phone') !== -1;
        var isEmailField = lowerKey.indexOf('email') !== -1;

        if (!isPhoneField && !isEmailField) {
            filtered[key] = fields[key];
        }
    });

    return filtered;
}

/**
 * Returns true when validation errors contain only payer name fields.
 * @param {Object} fields Form error map
 * @returns {boolean} true if first/last name are the only failing fields
 */
function hasOnlyNameErrors(fields) {
    var keys = Object.keys(fields || {});

    if (!keys.length) {
        return false;
    }

    return keys.every(function(key) {
        var lowerKey = key.toLowerCase();

        return lowerKey.indexOf('firstname') !== -1 || lowerKey.indexOf('lastname') !== -1;
    });
}

/**
 * Override PayPal shipping form validation to prevent false 422 on phone format only.
 * @param {Object} data Validation payload
 * @param {Object} form Optional SFCC form
 * @returns {Object} validation response
 */
base.validateShippingAddressForm = function(data, form) {
    var addressForm = form || server.forms.getForm('address');
    var shippingData = this.prepareShippingAddressData(data);
    var emailValue = data
        && data.shippingAddress
        && data.shippingAddress.email_address
        ? String(data.shippingAddress.email_address)
        : '';

    shippingData = mergeMissingFromBasketShipping(shippingData);
    shippingData = ensureNameFallback(shippingData, emailValue);
    shippingData.phone = normalizePhone(shippingData.phone, shippingData.countryCode);
    shippingData.stateCode = normalizeStateCode(shippingData.stateCode, shippingData.countryCode);

    if (emailValue) {
        shippingData.email = emailValue;
    }

    var shippingFields = this.validateAddressForm(addressForm, shippingData);
    var nonShippingErrors = dropNonShippingErrors(shippingFields);

    if (hasOnlyNameErrors(nonShippingErrors)) {
        Logger.warn('[PAYPAL422][overlay-validateShippingAddressForm] bypass name-only validation errors. fields={0}',
            JSON.stringify(nonShippingErrors));
        nonShippingErrors = {};
    }

    if (Object.keys(nonShippingErrors).length > 0) {
        Logger.warn('[PAYPAL422][overlay-validateShippingAddressForm] fields={0}; shippingData={1}',
            JSON.stringify(nonShippingErrors),
            JSON.stringify({
                firstName: shippingData.firstName,
                lastName: shippingData.lastName,
                address1: shippingData.address1,
                city: shippingData.city,
                postalCode: shippingData.postalCode,
                countryCode: shippingData.countryCode,
                stateCode: shippingData.stateCode,
                phone: shippingData.phone
            }));
    }

    return {
        error: Object.keys(nonShippingErrors).length > 0,
        errorName: 'shipping.address.invalid',
        fields: nonShippingErrors,
        message: Resource.msg('paypal.error.shipping.address.invalid', 'paypalerrors', null)
    };
};

/**
 * Overlay guard for PayPal payloads missing nested phone object.
 * Prevents base helper TypeError in updateOrderBillingAddress.
 * @param {dw.order.Basket} basket Current basket
 * @param {Object} billingAddress PayPal billing payload
 */
base.updateOrderBillingAddress = function(basket, billingAddress) {
    var safeBillingAddress = billingAddress || {};
    var safePhone = safeBillingAddress.phone || safeBillingAddress.phone_number || {};

    if (!safePhone.phone_number) {
        safePhone.phone_number = {
            national_number: safePhone.national_number || ''
        };
    }

    safeBillingAddress.phone = safePhone;

    return baseUpdateOrderBillingAddress.call(base, basket, safeBillingAddress);
};

/**
 * Overlay for PayPal shipping address updates with resilient phone fallback.
 * @param {dw.order.Basket} basket Current basket
 * @param {Object} shippingInfo PayPal shipping payload
 */
base.updateOrderShippingAddress = function (basket, shippingInfo) {
    var fullShippingName = shippingInfo.name.full_name;
    var fullName = base.createPersonNameObject(fullShippingName);
    var shippingAddress = shippingInfo.address;
    var orderShipping = shippingAddress || this.setAddressInPPAddressFormat(basket);

    Transaction.wrap(function () {
        var shipping = basket.getDefaultShipment().getShippingAddress() || basket.getDefaultShipment().createShippingAddress();

        shipping.setCountryCode(orderShipping.country_code);
        shipping.setCity(basicHelpers.getValueByKey(orderShipping, 'admin_area_2', ''));
        shipping.setAddress1(basicHelpers.getValueByKey(orderShipping, 'address_line_1', ''));
        shipping.setAddress2(basicHelpers.getValueByKey(orderShipping, 'address_line_2', ''));
        shipping.setPostalCode(decodeURIComponent(basicHelpers.getValueByKey(orderShipping, 'postal_code') || ''));
        shipping.setStateCode(basicHelpers.getValueByKey(orderShipping, 'admin_area_1', ''));
        shipping.setPhone(resolveShippingPhone(shippingInfo, shipping.getPhone()));

        if (!empty(fullName.firstName)) {
            shipping.setFirstName(basicHelpers.getValueByKey(fullName, 'firstName', ''));
        }

        if (!empty(fullName.lastName)) {
            shipping.setLastName(basicHelpers.getValueByKey(fullName, 'lastName', ''));
        }
    });
};

module.exports = base;
