'use strict';

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'isInWishlist', {
        enumerable: true,
        value: function(object, apiProduct) {
            if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
                var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
                var list = productListHelper.getList(request.session.customer, {type: 10});
                return list && productListHelper.itemExists(list, apiProduct.ID, {});
            } else {
                return false;
            }
        }(object, apiProduct)
    });
};
