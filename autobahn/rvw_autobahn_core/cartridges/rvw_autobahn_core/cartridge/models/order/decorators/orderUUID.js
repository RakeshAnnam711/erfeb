'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'orderUUID', {
        enumerable: true,
        value: function(object, apiObject) {
            return apiObject.UUID;
        } (object, apiObject)
    })
}
