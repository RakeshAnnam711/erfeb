'use strict';

/**
 * Returns a value of the first element in the array that satisfies the provided testing function.
 * Otherwise undefined is returned.
 * @param {Array} array - Array of elements to find the match in.
 * @param {Function} matcher - function that returns true if match is found
 * @return {Object|undefined} element that matches provided testing function or undefined.
 */
function find(array, matcher) {
    for (var i = 0, l = array.length; i < l; i++) {
        if (matcher(array[i], i)) {
            return array[i];
        }
    }

    return undefined;
}

/**
 * Returns diff between 2 arrays
 * @param {Array} arr1 - array to compare
 * @param {Array} arr2 - array to compare
 * @returns {Array} - array with diff values
 * @example
 * input arr1: ['a', 'b', 'c', 'd']
 * input arr2: ['a', 'b']
 * result object: ['c', 'd']
 */
function getDiff(arr1, arr2) {
    return arr1.filter(function (item) {
        return arr2.indexOf(item) === -1;
    });
}

/**
 * Returns array with uniaue elements
 * @param {Array} arr - array to be filtered
 * @returns {Array} - array with unique elements
 */
function unique(arr) {
    return arr.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
}

/**
 * Reduces an array to a single value using a callback function.
 *
 * @param {array} array - The array to reduce.
 * @param {function} callback - The function to execute on each element.
 * @param {any} initializer - The initial value for the accumulator.
 * @return {any} The final accumulated value.
 */
function reducer(array, callback, initializer) {
    var accumulator = (initializer === undefined) ? 0 : initializer;
    for (let i = 0; i < array.length; i++) {
        accumulator = callback(accumulator, array[i]);
    }
    return accumulator;
}

module.exports = {
    find: find,
    getDiff: getDiff,
    unique: unique,
    reducer: reducer
};
