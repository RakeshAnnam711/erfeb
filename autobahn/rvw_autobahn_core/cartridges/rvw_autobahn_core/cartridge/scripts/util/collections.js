'use strict';

var base = module.superModule;

/**
 * reduce method for dw.util.Collection subclass instances
 * @param {dw.util.Collection} collection - Collection subclass instance to reduce
 * @param {Function} callback - Function to execute on each value in the array
 * @return {Object} result of the execution of callback function on all items
 */
function reduce(collection, callback) {
    if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
    }

    var value;
    var passedInitialValue = false;
    var index = 1;
    var iterator = collection.iterator();

    if (arguments.length === 3) {
        value = arguments[2];
        index = 0;
        passedInitialValue = true;
    } else if (iterator.hasNext() && (collection.getLength() !== 1)) {
        value = iterator.next();
    }

    if (collection.getLength() === 0 && !value && !passedInitialValue) {
        throw new TypeError('Reduce of empty array with no initial value');
    }

    if ((collection.getLength() === 1 && !value && !passedInitialValue) || (collection.getLength() === 0 && passedInitialValue)) {
        return collection.getLength() === 1 ? iterator.next() : value;
    }

    while (iterator.hasNext()) {
        var item = iterator.next();
        value = callback(value, item, index, collection);
        index++;
    }

    return value;
}

base.reduce = reduce;

module.exports = base;
