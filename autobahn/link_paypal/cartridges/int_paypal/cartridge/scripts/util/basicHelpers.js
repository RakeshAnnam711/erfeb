'use strict';

const basicHelpers = {};

/**
 * @param {mixed} value object key
 * @param {mixed} defaultValue default value
 * @returns {mixed} return current or default value
 */
basicHelpers.getValueOr = function(value, defaultValue) {
    return value || defaultValue;
};

/**
 * @param {Object} object object
 * @param {mixed} key object key
 * @param {mixed} defaultValue default value
 * @returns {mixed} return value by key or default value
 */
basicHelpers.getValueByKey = function(object, key, defaultValue) {
    if (typeof key === 'string' && key.indexOf('.') > 0) {
        const keys = key.split('.');
        const newObject = object[keys.shift()];

        if (!newObject) {
            return defaultValue;
        }

        return this.getValueByKey(newObject, keys.join('.'), defaultValue);
    }

    return this.getValueOr(object[key], defaultValue);
};

/**
 * @param {dw.order.Basket} basket current user's basket
 * @returns {dw.customer.CustomerAddress|null} preferred customer address
 */
basicHelpers.getPreferredAddress = function(basket) {
    return this.getValueByKey(basket, 'customer.addressBook.preferredAddress', null);
};

basicHelpers.isObject = function(obj) {
    return obj !== null && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]';
};

basicHelpers.toCamelCase = function(value) {
    return value.toLowerCase().replace(/([-_ ][a-z])/g, function(group) {
        return group.toUpperCase().replace(/[-_ ]/g, '');
    });
};

basicHelpers.convertKeysToCamelCase = function(obj) {
    if (!this.isObject(obj)) {
        return obj;
    }

    const self = this;

    Object.keys(obj).forEach(function(key) {
        if (/[_-]/.test(key)) {
            const newKey = self.toCamelCase(key);

            obj[newKey] = obj[key];

            delete obj[key];

            key = newKey;
        }

        if (self.isObject(obj[key])) {
            self.convertKeysToCamelCase(obj[key]);
        }
    });

    return obj;
};

/**
 * Generates a random number in the specified range.
 * @param {number} min Start of the range.
 * @param {number} max End of the range.
 * @returns {number} Random number.
 */
basicHelpers.generateRandomNumber = function(min, max) {
    const SecureRandom = require('dw/crypto/SecureRandom');

    const randomValue = (new SecureRandom()).nextNumber();

    return Math.floor(randomValue * (max - min + 1)) + min;
};

/**
 * Generates a PayPal client metadata id
 * Generally is used for the FraudNet feature
 * @returns {string} Random string.
 */
basicHelpers.getPpClientMetadataId = function() {
    const UUIDUtils = require('dw/util/UUIDUtils');
    const UUID = UUIDUtils.createUUID();

    session.privacy.clientMetadataId = UUID;

    return UUID;
};

/**
* @param {string} locale - a locale value
* @returns {string} - return a locale with hyphen
*/
basicHelpers.getLocaleWithHyphen = function(locale) {
    let currentLocale = locale;

    if (currentLocale === 'default') {
        currentLocale = require('dw/system/Site').current.defaultLocale;
    }

    if (currentLocale.split('_').length !== 2) {
        currentLocale = [currentLocale, currentLocale].join('-');
    }

    return currentLocale.toLowerCase().replace('_', '-');
};

/**
 * Determines whether the given input is valid JSON or not.
 *
 * @param {string} input - The input value to check.
 * @returns {boolean} - `true` if the input is valid JSON, `false` otherwise.
 */
basicHelpers.isJson = function(input) {
    if (typeof input !== 'string') {
        return false;
    }

    try {
        const parsedJson = JSON.parse(input);
        const parsedType = Object.prototype.toString.call(parsedJson);

        return parsedType === '[object Object]' || parsedType === '[object Array]';
    } catch (error) {
        return false;
    }
};

/**
 * Pluralize
 * @param {number} value number value
 * @param {string} word word to pluralize
 * @param {string} [plural] word in plural
 * @returns {string} original or converted word
 */
basicHelpers.pluralize = function(value, word, plural) {
    return [1, -1].includes(Number(value)) ? word : (plural || word + 's');
};

/**
 * Calculates the number of months between the current date and a specified credit card's expiration date.
 * @param {number} expYear - The expiration year of the credit card (four digits).
 * @param {number} expMonth - The expiration month of the credit card (1-12).
 * @returns {number} The number of months between the current date and the expiration date.
 * Returns a negative number if the card is expired.
 */
basicHelpers.getExpirationMonthDiff = function(expYear, expMonth) {
    const now = new Date();
    const expirationDate = new Date(expYear, expMonth - 1); // months are 0-indexed in JavaScript

    return ((expirationDate.getFullYear() - now.getFullYear()) * 12) + (expirationDate.getMonth() - now.getMonth());
};

/**
 * Gets an array with formatted shipping options
 * @param {string} paymentMethodId payment method id
 * @param {Array} shippingOptions Array with shipping options
 * @returns {Object} An object with available shipping options and default shipping option id
 */
basicHelpers.getFormattedShippingOptions = function(paymentMethodId, shippingOptions) {
    const paypalConstants = require('*/cartridge/config/constants');

    let defaultShippingOptionId;

    const sortedShippingOptions = shippingOptions.slice().sort(function(a, b) {
        return b.selected - a.selected;
    });

    const formattedShippingOptions = sortedShippingOptions.map(function(shippingOption) {
        let formattedShippingOption;

        switch (paymentMethodId) {
            case paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY:
                formattedShippingOption = {
                    id: shippingOption.ID,
                    label: [shippingOption.shippingCost, shippingOption.displayName].join(': '),
                    description: shippingOption.description
                };

                if (shippingOption.default) {
                    defaultShippingOptionId = shippingOption.ID;
                }

                break;
            case paypalConstants.PAYMENT_METHOD_ID_APPLE_PAY:
                formattedShippingOption = {
                    identifier: shippingOption.ID,
                    label: shippingOption.displayName,
                    detail: shippingOption.description,
                    amount: shippingOption.shippingCost.replace(/[^0-9,.-]/g, '')
                };

                break;
            case paypalConstants.PAYMENT_METHOD_ID_PAYPAL:
                formattedShippingOption = {
                    id: shippingOption.ID,
                    label: shippingOption.displayName,
                    estimatedArrivalTime: shippingOption.estimatedArrivalTime,
                    selected: shippingOption.selected
                };

                break;
        }

        return formattedShippingOption;
    });

    return {
        defaultShippingOptionId: defaultShippingOptionId,
        shippingOptions: formattedShippingOptions
    };

};

module.exports = basicHelpers;
