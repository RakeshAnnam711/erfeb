'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var VideoHelper = require('*/cartridge/scripts/experience/utilities/videoHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storefront.popularCategories.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;

    model.componentID = context.component.ID;
    model.textHeadline = content.textHeadline;
    model.backgroundImageAlt = content.backgroundImageAlt || '';
    model.backgroundClass = content.backgroundClass || '';

    var catObj = {};
    var cat = content.category;
    if (cat) {
        catObj.ID = cat.ID;
        catObj.compID = context.component.ID;
        catObj.name = content.catDisplayName ? content.catDisplayName : cat.displayName;
        catObj.zoom = content.zoom === true ? 'zoom' : '';
        catObj.offset = content.offset || 'center';
        catObj.imagesize = content.imagesize || 'cover';
        catObj.aspectRatio = content.aspectRatio;
        catObj.textAlignment = content.textAlignment;

        if (content.catDisplayNameClass) {
            catObj.nameClass = content.catDisplayNameClass;
        }

        if (content.catSecondaryText) {
            catObj.secondaryText = content.catSecondaryText;
        }

        if (content.catSecondaryTextClass) {
            catObj.secondaryTextClass = content.catSecondaryTextClass;
        }

        if (content.textPlacement === 'inside image') {
            catObj.textPlacement = 'inside';
        } else {
            catObj.textPlacement = 'below';
        }

        if ('slotBannerImage' in cat.custom && cat.custom.slotBannerImage) {
            catObj.imageURL = cat.custom.slotBannerImage.getURL().toString();
        }

        if (cat.image) {
            catObj.imageURL = cat.image.getURL().toString();
        }

        if (content.image) {
            model.image = {
                alt: content.image.file.getAlt() || '',
                focalPointX: (content.image.focalPoint.x * 100) + '%',
                focalPointY: (content.image.focalPoint.y * 100) + '%',
                src: {
                    mobile: ImageTransformation.url(content.image, { device: 'mobile' }),
                    mobile2x: ImageTransformation.url(content.image, { device: 'mobile2x' }),
                    tablet: ImageTransformation.url(content.image, { device: 'tablet' }),
                    tablet2x: ImageTransformation.url(content.image, { device: 'tablet2x' }),
                    desktop: ImageTransformation.url(content.image, { device: 'desktop' }),
                    desktop2x: ImageTransformation.url(content.image, { device: 'desktop2x' })
                }
            };
            catObj.imageURL = null;
        } else {
            content.image = null;
        }

        if (content.backgroundVideoURL) {
            var backgroundVideoData = VideoHelper.getVideoDataFromUrl(content.backgroundVideoURL);

            if (backgroundVideoData.valid) {
                var params = {
                    modal: false,
                    inline: true,
                    autoplay: 1,
                    mute: 1,
                    controls: 0,
                    loop: 1,
                    hasThumb: false
                }
                model.backgroundVideo = {
                    type: backgroundVideoData.type,
                    id: backgroundVideoData.id,
                    fileType: backgroundVideoData.fileType,
                    params: JSON.stringify(params)
                }
                catObj.imageURL = null;
            }
        }

        catObj.url = cat.custom && 'alternativeUrl' in cat.custom && cat.custom.alternativeUrl
            ? cat.custom.alternativeUrl
            : URLUtils.url('Search-Show', 'cgid', cat.getID()).toString();
    }

    model.category = catObj;
    return new Template('experience/components/commerce_assets/popularCategory').render(model).text;
};
