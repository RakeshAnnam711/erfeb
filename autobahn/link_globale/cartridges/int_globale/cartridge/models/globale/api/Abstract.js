'use strict';

/**
 * Represents Abstract
 * @constructor
 */
function Abstract() {}

Abstract.prototype.toJSON = function () {
    var obj = {};
    Object.keys(this).forEach(function (prop) {
        if (this.hasOwnProperty(prop)) { // eslint-disable-line no-prototype-builtins
            obj[prop] = this[prop];
        }
    }, this);
    return obj;
};

module.exports = Abstract;
