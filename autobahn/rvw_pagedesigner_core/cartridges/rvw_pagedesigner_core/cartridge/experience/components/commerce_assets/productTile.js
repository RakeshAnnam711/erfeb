'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

// DO NOT CACHE this 'render' response as it calls a child controller with it's own cache rules, avoid double cache scenario
// where a OOS item is cached, then becomes Instock. The OOS display will be cached until the cache is cleared.
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.productTile component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    // if product was invalid or offline, we can't render it
    if (!context.content.product || !context.content.product.online) {
        return;
    }
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var tileAction = model.queryString && model.queryString.ajaxRegion === 'belowFold' ? 'Tile-Show' : 'Tile-PlaceHolder';

    model.TileURL = URLUtils.url(tileAction,
        'pid', content.product.ID,
        'pview', 'tile',
        'ratings', content.displayRatings,
        'swatches', content.displaySwatches,
        'showQuickView', content.displayQuickview,
        'showQuickAddToCart', content.displayQuickAddToCart,
        'hideWishlist', content.hideWishlist
    );

    return new Template('experience/components/commerce_assets/product/productTile').render(model).text;
};
