var Collection = function (array) {
    var items = [];
    if (array) {
        items = array;
    }

    this.add = function (item) {
        items.push(item);
    };

    this.iterator = function () {
        var i = 0;
        return {
            hasNext: function () {
                return i < items.length;
            },
            next: function () {
                return items[i++];
            }
        };
    };

    this.getLength = function () {
        return items.length;
    };

    this.length = this.getLength();

    this.toArray = function () {
        return items;
    };

    this.addAll = function (collection) {
        items = items.concat(collection.toArray());
    };

    this.contains = function (item) {
        return array.indexOf(item) >= 0;
    };

    this.map = function () {
        var args = Array.from(arguments);
        var list = args[0];
        var callback = args[1];
        if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
            list = list.toArray();
        }
        return list ? list.map(callback) : [];
    };

    this.get = function (index) {
        return items[index];
    };
};

Collection.prototype.remove = function (obj) {};
Collection.prototype.size = function () {};
Collection.prototype.isEmpty = function () {};

module.exports = Collection;

/**
 * Supplements an existing JavaScript array with Demandware collection methods.
 * This is useful when you have a unit test where the method you're testing
 * expects a Demandware collection.
 */
module.exports.createFromArray = function (arr) {
    arr.size = function () {
        return arr.length;
    };

    arr.remove = function (obj) {
        arr.splice(arr.indexOf(obj), 1);
    };

    return arr;
};
