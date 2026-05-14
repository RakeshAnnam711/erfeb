'use strict';

module.exports = function (object, apiObject) {
    Object.defineProperty(object, 'orderEmail', {
        enumerable: true,
        value: apiObject.customerEmail || ((apiObject.customer && apiObject.customer.registered && apiObject.customer.profile) ? (apiObject.customer.profile.email || '') : '')
    })
}
