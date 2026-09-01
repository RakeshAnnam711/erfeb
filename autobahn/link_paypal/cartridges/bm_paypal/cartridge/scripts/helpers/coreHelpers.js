'use strict';

/**
 * @param {Object} object object
 * @param {mixed} key object key
 * @param {mixed} defaultValue default value
 * @returns {mixed} return value by key or default value
 */
function getValueByKey(object, key, defaultValue) {
    if (typeof key === 'string' && key.indexOf('.') > 0) {
        const keys = key.split('.');
        const newObject = object[keys.shift()];

        if (!newObject) {
            return defaultValue;
        }

        return getValueByKey(newObject, keys.join('.'), defaultValue);
    }

    return object[key] || defaultValue;
}

/**
 * Pluralize
 * @param {number} value number value
 * @param {string} word word to pluralize
 * @param {string} [plural] word in plural
 * @returns {string} original or converted word
 */
function pluralize(value, word, plural) {
    return [1, -1].includes(Number(value)) ? word : (plural || word + 's');
}

/**
 * Sort array of objects by property
 * @param {Object[]} array array of objects
 * @param {string} property property of object
 * @returns {Object[]} array of objects
 */
function sortByProperty(array, property) {
    return array.sort(function(prev, next) {
        return prev[property] > next[property] ? 1 : -1;
    });
}

/**
 * Filter array of objects by property
 * @param {Object[]} array array of objects
 * @param {string} property property of object
 * @param {string} value by which value to filter
 * @returns {Object[]} filtered array of objects
 */
function filterByProperty(array, property, value) {
    return array.filter(function(item) {
        return item[property] === value;
    });
}

/**
 * Determines whether the given input is valid JSON or not.
 *
 * @param {string} input - The input value to check.
 * @returns {boolean} - `true` if the input is valid JSON, `false` otherwise.
 */
function isJson(input) {
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
}

/**
 * function to proceed a save parsing
 * @param {string} element string what should be parsed
 * @returns {Object} result of parsing
 */
function tryParseJSON(element) {
    let result;

    try {
        result = JSON.parse(element);
    } catch (error) {
        const Logger = require('dw/system/Logger');
        const logger = Logger.getLogger('PayPal-BM', 'PayPal_General');

        logger.error(['Unable to parse:  ', element, error.stack].join(' '));
    }

    return result;
}

/**
 * Returns the type of the instance
 * @returns {string} The type of the instance
 */
function getInstanceType() {
    const System = require('dw/system/System');
    const ppConstants = require('~/cartridge/config/constants');

    switch (System.instanceType) {
        case System.DEVELOPMENT_SYSTEM:
            return ppConstants.INSTANCE_DEVELOPMENT;
        case System.STAGING_SYSTEM:
            return ppConstants.INSTANCE_STAGING;
        case System.PRODUCTION_SYSTEM:
            return ppConstants.INSTANCE_PRODUCTION;
    }

    return '';
}

/**
 * Check Set Value
 * @param {mixed} value - Value
 * @returns {string} - The value passed is set or not
 */
function checkSetValue(value) {
    const Resource = require('dw/web/Resource');

    if (typeof value === 'string' && value.length) {
        return Resource.msg('value.set', 'paypalbm', null);
    }

    return Resource.msg('value.notset', 'paypalbm', null);
}

/**
 * Checks if the given value is an object excluding null.
 * Specifically checks for objects created using object literal notation or new Object.
 *
 * @param {*} obj - The value to check.
 * @returns {boolean} True if the value is an object excluding null; false otherwise.
 */
function isObject(obj) {
    return obj !== null && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * Builds a URL query string part from a key and an array of values
 * @param {string} key - The name of the query parameter
 * @param {Array<string | number | boolean>} values - The array of values to be joined in the query string
 * @returns {string} A query part like '&key=value1,value2' or an empty string if the array is empty
 */
function buildQueryPart(key, values) {
    return values.length ? '&'.concat(key, '=', values.join(',')) : '';
}

/**
 * Checks if a parameter in HttpParameterMap is submitted and not empty.
 * @param {dw.web.HttpParameterMap} httpParameterMap - The HttpParameterMap object containing request parameters.
 * @param {string} parameterName - The name of the parameter to check.
 * @returns {boolean} - Returns true if the parameter is submitted and not empty, otherwise false.
 */
function isParameterSubmittedAndNotEmpty(httpParameterMap, parameterName) {
    if (!httpParameterMap[parameterName]) {
        return false;
    }

    if (httpParameterMap[parameterName].empty) {
        return false;
    }

    return httpParameterMap[parameterName].submitted;
}

/**
 * Retrieves the start and end dates.
 * If 'dateFrom' and 'dateTo' are provided in the HttpParameterMap, they are used instead.
 *
 * @param {dw.web.HttpParameterMap} hm - The HttpParameterMap object containing request parameters.
 * @returns {Object} - An object containing the period with properties 'dateFrom' and 'dateTo' in 'MM/dd/yyyy' format.
 */
function getPeriod(hm) {
    const Calendar = require('dw/util/Calendar');
    const StringUtils = require('dw/util/StringUtils');

    const DAYS_BEFORE = 30;
    const DATE_FORMAT = 'MM/dd/yyyy';

    const calendar = new Calendar();

    const endOfMonth = StringUtils.formatCalendar(calendar, DATE_FORMAT);

    calendar.add(Calendar.DAY_OF_MONTH, -DAYS_BEFORE);

    const startOfMonth = StringUtils.formatCalendar(calendar, DATE_FORMAT);

    return {
        dateFrom: isParameterSubmittedAndNotEmpty(hm, 'dateFrom') ? hm.dateFrom.stringValue : startOfMonth,
        dateTo: isParameterSubmittedAndNotEmpty(hm, 'dateTo') ? hm.dateTo.stringValue : endOfMonth
    };
}

module.exports = {
    isJson: isJson,
    isObject: isObject,
    pluralize: pluralize,
    sortByProperty: sortByProperty,
    filterByProperty: filterByProperty,
    tryParseJSON: tryParseJSON,
    getInstanceType: getInstanceType,
    checkSetValue: checkSetValue,
    getValueByKey: getValueByKey,
    buildQueryPart: buildQueryPart,
    isParameterSubmittedAndNotEmpty: isParameterSubmittedAndNotEmpty,
    getPeriod: getPeriod
};
