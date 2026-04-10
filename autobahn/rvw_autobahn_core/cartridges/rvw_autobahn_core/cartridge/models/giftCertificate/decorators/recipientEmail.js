'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'recipientEmail', {
        enumerable: true,
        value: apiObject.recipientEmail
    });
};
