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

    model.frenzyData = {
        brand: false,
        title: false,
        price: false,
        eventsUrl_Frenzy: 'events',
        event_name: 'most_clicked_skus_carousel_product_click',
        api_url: content.api_url,
        auth_key_value : content.auth_key_value,
        number_days_ago : content.number_days_ago,
        productPrice: content.productPrice,
        productName: content.productName,
        tileBackground: content.tileBackground,
        altTitle: content.frenzytitle ? content.frenzytitle.toLowerCase().replace(/(^|\s)\S/g, function(t) { return t.toUpperCase(); }) : ''
    };

    model.title = content.frenzytitle ? content.frenzytitle : null;
    model.titleColor = content.frenzytitleColor ? content.frenzytitleColor : null;
    model.titleFontSize = content.frenzytitleFontSize ? content.frenzytitleFontSize : null;

    model.subTitle = content.frenzysubTitle ? content.frenzysubTitle : null;
    model.subTitleColor = content.frenzysubTitleColor ? content.frenzysubTitleColor : null;
    model.SubTitleFontSize = content.frenzySubTitleFontSize ? content.frenzySubTitleFontSize : null;
    
    model.showShadow = content.showShadow ? 'show-shadow' : '';


    return new Template('experience/components/commerce_assets/wgacaFrenzySlider').render(model).text;
};
