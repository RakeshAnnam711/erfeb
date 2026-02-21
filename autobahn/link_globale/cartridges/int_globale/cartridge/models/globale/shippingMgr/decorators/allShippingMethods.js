'use strict';

module.exports = function (object) {
    var allShippingMethods = null;
    Object.defineProperties(object, {
        getAllShippingMethods: {
            value: function (globaleOnly) {
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var collections = require('*/cartridge/scripts/util/globale/collections');
                var shippingMethods = this.super.getAllShippingMethods();
                shippingMethods = collections.filter(shippingMethods, function (shippingMethod) {
                    return (
                        (globaleOnly && shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod])
                        || (!globaleOnly && !shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod])
                    );
                });
                return shippingMethods;
            }
        },
        allShippingMethods: {
            enumerable: true,
            get: function () {
                if (!allShippingMethods) {
                    allShippingMethods = this.getAllShippingMethods();
                }
                return allShippingMethods;
            }
        }
    });
};
