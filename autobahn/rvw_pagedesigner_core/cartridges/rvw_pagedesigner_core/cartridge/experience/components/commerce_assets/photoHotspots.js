'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var productImages = require('*/cartridge/models/product/decorators/images');
var productPrice = require('*/cartridge/models/product/decorators/price');
var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');


function getProductImage(product) {
    var imageProduct = product.master ? product.variationModel.defaultVariant : product;
    var imageObject = new Object;
    productImages(imageObject, imageProduct, { types: ['small'], quantity: 'single' });

    return imageObject.images.small[0];
}

function getProductPrice(product) {
    var productObject = new Object;
    productPrice(productObject, product, null, true, null);

    return productObject.price;
}

/**
 * Render logic for storefront.photoHotspots component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var maxHotspots = 10;
    var hotspots = [];

    model.containerClass = content.containerClass || '';
    model.tooltipClass = content.tooltipClass || '';
    model.customImageAlt = content.customImageAlt || '';
    model.breakpoints = ContentImageBreakpoints;

    // Main image
    model.image = {
        alt: content.image1.file.getAlt() || '',
        focalPointX: (content.image1.focalPoint.x * 100) + '%',
        focalPointY: (content.image1.focalPoint.y * 100) + '%',
        src: {
            mobile: ImageTransformation.url(content.image1, { device: 'mobile' }),
            mobile2x: ImageTransformation.url(content.image1, { device: 'mobile2x' }),
            tablet: ImageTransformation.url(content.image1, { device: 'tablet' }),
            tablet2x: ImageTransformation.url(content.image1, { device: 'tablet2x' }),
            desktop: ImageTransformation.url(content.image1, { device: 'desktop' }),
            desktop2x: ImageTransformation.url(content.image1, { device: 'desktop2x' })
        }
    };

    for (var i = 1; i <= maxHotspots; i++) {
        var hotspotImage = content['image' + i];

        if (hotspotImage) {
            var hotspotPrimaryText = content['primaryText' + i];
            var hotspotSecondaryText = content['secondaryText' + i];
            var hotspotProduct = content['product' + i];
            var hotspotObject = {
                left: hotspotImage.focalPoint.x * 100 + '%',
                top: hotspotImage.focalPoint.y * 100 + '%',
                theme: content['hotspotTheme' + i] || ''
            }

            if (hotspotPrimaryText) {
                hotspotObject.primaryText = hotspotPrimaryText.replace(/'/g, "&#39;");
                hotspotObject.primaryTextClass = content['primaryTextClass' + i] || '';
            }

            if (hotspotSecondaryText) {
                hotspotObject.secondaryText = hotspotSecondaryText.replace(/'/g, "&#39;");
                hotspotObject.secondaryTextClass = content['secondaryTextClass' + i] || '';
            }

            if (hotspotProduct) {
                hotspotObject.product = {
                    id: hotspotProduct.ID,
                    name: hotspotProduct.name,
                    image: getProductImage(hotspotProduct),
                    price: getProductPrice(hotspotProduct)
                }
            }

            hotspots.push(hotspotObject);
        }
    }

    model.hotspots = hotspots;

    return new Template('experience/components/commerce_assets/photoHotspots').render(model).text;
};
