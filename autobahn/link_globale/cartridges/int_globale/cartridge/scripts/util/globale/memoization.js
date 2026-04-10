'use strict';

/**
 * Creates a function that memoizes the result of `func`.
 * If `resolver` is provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 * @throws {Error}
 * @param {Function} func - the function to have its output memoized.
 * @param {Function} [resolver] - the function to resolve the cache key.
 * @returns {Function} returns the new memoized function.
 * @example
 * // Basic usage
 * const memoizedFunction = memoize(function(a, b) {
 *     return a + b;
 * });
 * memoizedFunction(1, 2); // Calculates and caches result
 * memoizedFunction(1, 2); // Returns cached result without recalculating
 *
 * // Usage with a resolver function
 * const resolverFunction = function() {
 *     return Array.prototype.slice.call(arguments).join('|');
 * };
 * const memoizedFunctionWithResolver = memoize(function(a, b) {
 *     return a + b;
 * }, resolverFunction);
 * memoizedFunctionWithResolver(1, 2); // Calculates and caches result with resolver
 * memoizedFunctionWithResolver(1, 2); // Returns cached result based on resolver key
 */
function memoize(func, resolver) {
    if (typeof func !== 'function' || (resolver != null && typeof resolver !== 'function')) {
        throw new Error('Expected a function');
    }

    // Initialize the cache object for the memoized function
    var memoizedCache = {};

    /**
     * The memoized function that caches results for faster subsequent invocations.
     * @param {...*} args - the arguments passed to the original function.
     * @returns {*} - returns the result of the original function.
     */
    var memoized = function () {
        var args = Array.prototype.slice.call(arguments);
        var key = resolver ? resolver.apply(this, args) : args[0];

        if (Object.prototype.hasOwnProperty.call(memoizedCache, key)) {
            return memoizedCache[key];
        }

        var result = func.apply(this, args);
        memoizedCache[key] = result;

        return result;
    };

    return memoized;
}

/**
 * A function to generate a simple key for memoization resolver.
 * Should be used only if input arguments have primitive types: strings, numbers, booleans
 *
 * @param {...*} arguments - the arguments of original/memoized function
 * @return {string} returns generated simple key.
 */
function getResolverSimpleKey() {
    return Array.prototype.slice.call(arguments).join('|');
}

module.exports = {
    memoize: memoize,
    getResolverSimpleKey: getResolverSimpleKey
};
