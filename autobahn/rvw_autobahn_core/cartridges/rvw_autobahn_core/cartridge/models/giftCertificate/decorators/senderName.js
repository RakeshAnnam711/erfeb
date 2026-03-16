'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'senderName', {
        enumerable: true,
        value: apiObject.senderName
    });
};
