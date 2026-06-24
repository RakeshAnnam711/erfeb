'use strict';

function getTileURLs(context, querystring) {
    var URLUtils = require('dw/web/URLUtils');

    //If context.product is empty logging still needs a PID value
    var pid = context.product.id || querystring.pid;

    //Add first Product Variation to product url so the variation shown on tile is pre-selected
    context.urls.product = URLUtils.url('Product-Show', 'pid', pid);
    context.urls.quickView = URLUtils.url('Product-ShowQuickView', 'pid', pid);
    context.urls.quickAddToCart = URLUtils.url('Product-ShowQuickAddToCart', 'pid', pid);

    if (context.product.firstAttrValue){
        var firstProductVariationURLSuffix = 'dwvar_' + pid + '_'+ context.product.firstAttrValue.groupId;
        context.urls.product = URLUtils.url('Product-Show', 'pid', pid, firstProductVariationURLSuffix, context.product.firstAttrValue.value);
        context.urls.quickView = URLUtils.url('Product-ShowQuickView', 'pid', pid, firstProductVariationURLSuffix, context.product.firstAttrValue.value);
        context.urls.quickAddToCart = URLUtils.url('Product-ShowQuickAddToCart', 'pid', pid, firstProductVariationURLSuffix, context.product.firstAttrValue.value);
    }

    // Improve caching if cgid is the same value as default category
    if (!empty(querystring.cgid) && querystring.cgid !== context.product.primaryCategory) {
        context.urls.product.append('cgid', querystring.cgid);
        context.urls.quickView.append('cgid', querystring.cgid);
        context.urls.quickAddToCart.append('cgid', querystring.cgid);
    }

    context.swatchMethod = context.abConfigs.plpSwatchShow || 'on-hover';
    context.plpContentAlignment = context.abConfigs.plpContentAlignment || 'left';
    context.plpHoverEffects = context.abConfigs.plpHoverEffects || 'bottom-border';
    context.quickbuyMethod = context.abConfigs.plpQuickbuyButtonOrIcon || 'hide';
    context.quickAddToCartMethod = context.abConfigs.plpQuickAddToCartButtonOrIcon || 'hide';

    // hide quickview if quick view button or icon preference not selected unless passed through tile querystring
    if ('showQuickView' in querystring) {
        context.display.showQuickView = querystring.showQuickView === 'true' ? true : false;
        if (context.display.showQuickView && context.quickbuyMethod === 'hide') {
            context.quickbuyMethod = 'icon';
        }
    } else if (context.quickbuyMethod == 'hide') {
        context.display.showQuickView = false;
    }
    // hide quick addtocart if button or icon preference not selected unless passed through tile querystring
    if ('showQuickAddToCart' in querystring) {
        context.display.showQuickAddToCart = querystring.showQuickAddToCart === 'true' ? true : false;
        if (context.display.showQuickAddToCart && context.quickAddToCartMethod === 'hide') {
            context.quickAddToCartMethod = 'icon';
        }
    } else if (context.quickAddToCartMethod == 'hide') {
        context.display.showQuickAddToCart = false;
    }

    return context;
}

module.exports = {
    getTileURLs: getTileURLs
}
