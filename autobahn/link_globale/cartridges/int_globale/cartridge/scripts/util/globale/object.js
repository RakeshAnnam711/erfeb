'use strict';

/**
 * Returns property value using path in dot natation
 * @param {Object} obj - input object
 * @param {string} path - path in dot natation
 * @param {Object} defaultValue - default value to be returned
 * @returns {Object} - property value
 * @example
 * input object: { A: { B: { C: 'CValue' } } }
 * path: 'A.B.C'
 */
function getValueByPath(obj, path, defaultValue) {
    var result = defaultValue;
    try {
        result = path.split('.').reduce(function (inputObj, prop) {
            return inputObj[prop];
        }, obj);
    } catch (e) {
        return defaultValue;
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * Set value in object by path
 * for example: obj = {a:{b:{c:1}},d:2}, value = 2, path = 'b.c', set 2 instead of 1
 * @param {Object} obj - input object
 * @param {string} path - path in dot natation
 * @param {string} value - value to set
 * @example
 * input object: { A: { B: { C: 'CValue' } } }
 * path: 'A.B.C'
 * value: 'CCValue'
 * result object: { A: { B: { C: 'CCValue' } } }
 */
function setValueByPath(obj, path, value) {
    try {
        path = path.split('.'); // eslint-disable-line no-param-reassign
        var i;
        var length = path.length - 1;
        for (i = 0; i < length; i++) {
            obj = obj[path[i]]; // eslint-disable-line no-param-reassign
        }
        obj[path[i]] = value; // eslint-disable-line no-param-reassign
    } catch (e) {
        // handle error
    }
}

/**
 * Returns filtered object without excluded keys
 * @param {Object} obj - input object
 * @param {Array} excludedKeys - array of keys that should be excluded
 * @param {Object} defaultValue - default value to be returned
 * @returns {Object} - filtered object
 * @example
 * obj: { A: 'AValue', B: 'BValue' }
 * excludedKeys: ['AValue']
 * return obj: { B: 'BValue' }
 */
function filterByKeysToExclude(obj, excludedKeys, defaultValue) {
    var result = defaultValue;
    try {
        Object.keys(obj).forEach(function (key) {
            if (excludedKeys.indexOf(key) === -1) {
                result[key] = obj[key];
            }
        });
    } catch (e) {
        result = defaultValue;
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * Returns merged object
 * @param {Object} obj1 - object 1
 * @param {Object} obj2 - object 2
 * @returns {Object} result - new object which contains merged objects
 */
function merge(obj1, obj2) {
    var result = {};
    Object.keys(obj1).forEach(function (key) {
        result[key] = obj1[key];
    });
    Object.keys(obj2).forEach(function (key) {
        result[key] = obj2[key];
    });
    return result;
}

/**
 * Maps the values of an object to a new object using the provided function.
 * @param {Object} obj - The input object to be mapped.
 * @param {Function} func - The mapping function to be applied to each value.
 * @return {Object} The new object with mapped values.
 */
function map(obj, func) {
    var result = {};
    Object.keys(obj).forEach(function (key) {
        result[key] = func(obj[key]);
    });
    return result;
}

module.exports = {
    getValueByPath: getValueByPath,
    setValueByPath: setValueByPath,
    filterByKeysToExclude: filterByKeysToExclude,
    merge: merge,
    map: map
};
