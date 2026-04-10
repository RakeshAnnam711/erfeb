'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'message', {
        enumerable: true,
        value: apiObject.message
    });
};
