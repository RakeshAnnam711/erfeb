'use strict';

module.exports = function (object, apiProduct, productSearchHit) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
        var wishlistpid;

        if (apiProduct.master) {
            if (
                productSearchHit
                && apiProduct.variationModel
                && apiProduct.variationModel.productVariationAttributes.length === 1
                && apiProduct.variationModel.productVariationAttributes[0].attributeID === 'color')
            {
                wishlistpid = productSearchHit.firstRepresentedProduct.ID;
            } else {
                var masterDefaultVariantId = apiProduct.getVariationModel().getDefaultVariant().ID;

                if (masterDefaultVariantId) {
                    wishlistpid = masterDefaultVariantId;
                } else {
                    wishlistpid = false;
                }
            }
        } else {
            wishlistpid = apiProduct.ID;
        }

        Object.defineProperty(object, 'wishlistpid', {
            enumerable: true,
            value: wishlistpid
        });
    }
};
