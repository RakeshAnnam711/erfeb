'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'recipientName', {
        enumerable: true,
        value: apiObject.recipientName
    });
};
