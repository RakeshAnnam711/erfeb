'use strict';

module.exports = function (object) {
    var applicableShippingMethods = null;
    Object.defineProperties(object, {
        getApplicableShippingMethods: {
            value: function (shippingAddressObj, globaleOnly) {
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var collections = require('*/cartridge/scripts/util/globale/collections');
                var shippingMethods = this.super.getApplicableShippingMethods.apply(this.super, Array.prototype.slice.call(arguments, 0, 1));
                shippingMethods = collections.filter(shippingMethods, function (shippingMethod) {
                    return (
                        (globaleOnly && shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod])
                        || (!globaleOnly && !shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod])
                    );
                });
                return shippingMethods;
            }
        },
        applicableShippingMethods: {
            enumerable: true,
            get: function () {
                if (!applicableShippingMethods) {
                    applicableShippingMethods = this.getApplicableShippingMethods();
                }
                return applicableShippingMethods;
            }
        }
    });
};
