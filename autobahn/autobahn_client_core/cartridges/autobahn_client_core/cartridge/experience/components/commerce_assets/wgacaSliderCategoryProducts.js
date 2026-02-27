'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for storefront.carousel layout.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    
    model.display = {
        swatches: false,
        ratings: false,
        showQuickView: false,
        isSliderProduct: true,
        tileBackground: content.tileBackground
    };
    
    model.categoryID = content.category ? content.category.ID : '';
    model.productsToDisplay = content.products_to_display ? content.products_to_display : 0;
    model.section=content.section?content.section:'';
    
    model.showShadow = content.showShadow ? 'show-shadow' : '';

    return new Template('experience/components/commerce_assets/wgacaSliderCategoryProducts').render(model).text;
};
