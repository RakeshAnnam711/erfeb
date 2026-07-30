'use strict';

module.exports = function(object, apiProduct) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');

    // Get the attribute group values that should be displayed as swatches on the PDP, defaulting to just use color - defined as an array
    Object.defineProperty(object, 'attrsToUseForSwatch', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('swatchableAttributes', apiProduct, 'swatchableAttributes')
    });

    Object.defineProperty(object, 'attrGroupInclusion', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpAttributeGroupsShow', apiProduct, 'pdpAttributeGroupsShow')
    });

    // Site preference that determines if color swatches are displayed as default or thumbnail image
    Object.defineProperty(object, 'pdpSwatchTypeAsImage', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpSwatchTypeAsImage')
    });

    // Get Sticky Add to Cart product attribute / site pref
    Object.defineProperty(object, 'enableStickyAddToCart', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('enablePdpStickyAddToCart', apiProduct, 'enablePdpStickyAddToCart')
    });

    // Get Sticky Add to Cart variation selection product attribute / site pref
    Object.defineProperty(object, 'enableVariantSelectionInPdpStickyAddToCart', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('enableVariantSelectionInPdpStickyAddToCart', apiProduct, 'enableVariantSelectionInPdpStickyAddToCart')
    });

    // Get the hideQty product attribute / site pref
    Object.defineProperty(object, 'hideQty', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('hideQty', apiProduct, 'hideQty')
    });

    // Get the enableQuantityStepper site pref
    Object.defineProperty(object, 'enableQuantityStepper', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('enableQuantityStepper')
    });

    Object.defineProperty(object, 'pdpCollapsibleContentDesktop4', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpCollapsibleContentDesktop4', apiProduct, 'pdpCollapsibleContentDesktop4')
    });

    Object.defineProperty(object, 'pdpCollapsibleContentDesktop3', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpCollapsibleContentDesktop3', apiProduct, 'pdpCollapsibleContentDesktop3')
    });

    Object.defineProperty(object, 'pdpCollapsibleContentDesktop2', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpCollapsibleContentDesktop2', apiProduct, 'pdpCollapsibleContentDesktop2')
    });

    Object.defineProperty(object, 'pdpCollapsibleContentDesktop1', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpCollapsibleContentDesktop1', apiProduct, 'pdpCollapsibleContentDesktop1')
    });

    Object.defineProperty(object, 'pdpHideSingleVariants', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpHideSingleVariants', apiProduct, 'pdpHideSingleVariants')
    });

    Object.defineProperty(object, 'pdpImageColumnWidth', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('pdpImageColumnWidth', apiProduct, 'pdpImageColumnWidth', true)
    });

    Object.defineProperty(object, 'storeTypePreferences', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('storeTypePreferences')

    });
    // Site preference that determines if headline and headline description are displayed on quickview
    Object.defineProperty(object, 'quickviewShowHeadlineAndDescription', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('quickviewShowHeadlineAndDescription')
    });

    Object.defineProperty(object, 'makeAnOfferEnabled', {
        enumerable: true,
        value: preferenceHelper.getAttributeValue('make_offer_enabled', apiProduct, 'make_offer_enabled')
    });
};
