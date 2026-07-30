'use strict';

/**
 * Returns value or empty string if null
 * @param {string} value - value to set
 * @returns {Object} - value or empty string if null
 */
function getValueOrEmptyStringIfNull(value) {
    return value !== null ? value : '';
}

/**
 * Returns boolean value from string
 * @param {string} value - value to set
 * @param {boolean|undefined} defaultValue - default value
 * @returns {boolean} - boolean value
 */
function getBooleanValueFromString(value, defaultValue) {
    var result = !!defaultValue;

    try {
        var inputValue = value.toLowerCase();
        if (inputValue === 'true') {
            result = true;
        } else if (inputValue === 'false') {
            result = false;
        }
    } catch (e) {
        // skip error handling
    }

    return result;
}

/**
 * Returns boolean value from string
 * @param {string} value - value to set
 * @param {Object} defaultValue - default value
 * @returns {Object} - object value
 */
function getJsonObjectFromString(value, defaultValue) {
    var result = defaultValue;

    try {
        result = JSON.parse(value);
    } catch (e) {
        result = defaultValue;
    }

    return result;
}

module.exports = {
    getValueOrEmptyStringIfNull: getValueOrEmptyStringIfNull,
    getBooleanValueFromString: getBooleanValueFromString,
    getJsonObjectFromString: getJsonObjectFromString
};
