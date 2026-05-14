'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var VideoHelper = require('*/cartridge/scripts/experience/utilities/videoHelper.js');
var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var buttonVideoParams = {
        modal: true,
        inline: false,
        autoplay: 0,
        mute: 0,
        controls: 1,
        loop: 0,
        hasThumb: true
    };

    model.componentID = context.component.ID;
    model.subtitle = content.subtitle || '';
    model.subtitleClass = content.subtitleClass || '';
    model.heading = content.heading ? content.heading : null;
    model.headingClass = content.headingClass || '';
    model.secondaryText = content.secondaryText ? content.secondaryText : null;
    model.secondaryTextClass = content.secondaryTextClass || '';
    model.backgroundImageAlt = content.backgroundImageAlt || '';
    model.backgroundClass = content.backgroundClass || '';
    model.link = content.ITCLink ? content.ITCLink : null;
    model.isExternalLink = model.link !== null && model.link.indexOf(request.httpHost) === -1;
    model.linkOpenNewTab = content.linkOpenNewTab || false;
    model.zoom = content.zoom === true ? 'zoom' : '';
    model.offset = content.offset || 'center';
    model.imagesize = content.imagesize || 'cover';
    model.aspectRatio = content.aspectRatio;
    model.textAlignment = content.textAlignment;
    model.backgroundVideoPlayWhenFullyInView = content.backgroundVideoPlayWhenFullyInView || false;
    // WGACA MODIFICATION - additional model attribute
    model.textClass = content.textClass || '';

    if (content.image) {
        model.image = {
            alt: content.image.file.getAlt() || '',
            focalPointX: (content.image.focalPoint.x * 100) + '%',
            focalPointY: (content.image.focalPoint.y * 100) + '%',
            src: {
                mobile: ImageTransformation.url(content.image, { device: 'mobile', format: 'WebP', sw: 375, sh: 250 }),
                mobile2x: ImageTransformation.url(content.image, { device: 'mobile2x', format: 'WebP', sw: 750, sh: 500  }),
                tablet: ImageTransformation.url(content.image, { device: 'tablet', format: 'WebP' }),
                tablet2x: ImageTransformation.url(content.image, { device: 'tablet2x', format: 'WebP'  }),
                desktop: ImageTransformation.url(content.image, { device: 'desktop',format: 'WebP', sw: 1440, sh: 600, }),
                desktop2x: ImageTransformation.url(content.image, { device: 'desktop2x',format: 'WebP', sw: 2880, sh: 1200 })
            }
        };
    }

    if (content.buttonAction) {
        model.buttonAction = content.buttonAction;
        model.buttonText = content.buttonText;
        model.buttonStyle = 'btn-' + content.buttonStyle.toLowerCase();
        model.buttonClass = content.buttonClass || '';
        model.buttonIsExternalLink = content.buttonAction.indexOf(request.httpHost) === -1;
        model.buttonOpenNewTab = content.buttonOpenNewTab || false;

        var buttonVideoData = VideoHelper.getVideoDataFromUrl(model.buttonAction);
        if (buttonVideoData.valid) {
            model.buttonVideo = {
                type: buttonVideoData.type,
                id: buttonVideoData.id,
                fileType: buttonVideoData.fileType,
                params: JSON.stringify(buttonVideoParams)
            }
        }
    }

    if (content.textPlacement === 'inside image') {
        model.textPlacement = 'inside';
    } else {
        model.textPlacement = 'below';
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
        }
    }

    // animations
    var animationDistance = content.textAnimationDistance.toLowerCase();
    model.subtitleAnimationDelay = content.subtitleAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.titleAnimationDelay = content.titleAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.bodyAnimationDelay = content.bodyAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.buttonsAnimationDelay = content.buttonsAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.textAnimationPlayOnce = content.textAnimationPlayOnce || false;
    model.disableMobileAnimation = content.disableMobileAnimation || false;

    switch (content.textAnimation) {
        case 'Zoom in':
            model.textAnimation = 'scale-in-center--' + animationDistance;
            break;
        case 'Hinge drop':
            model.textAnimation = 'hinge-drop--' + animationDistance;
            break;
        case 'Flip in top':
            model.textAnimation = 'flip-in-hor-top--' + animationDistance;
            break;
        case 'Flip in bottom':
            model.textAnimation = 'flip-in-hor-bottom--' + animationDistance;
            break;
        case 'Slide in from top':
            model.textAnimation = 'slide-in-top--' + animationDistance;
            break;
        case 'Slide in from left':
            model.textAnimation = 'slide-in-left--' + animationDistance;
            break;
        case 'Slide in from right':
            model.textAnimation = 'slide-in-right--' + animationDistance;
            break;
        case 'Slide in from bottom':
            model.textAnimation = 'slide-in-bottom--' + animationDistance;
            break;
        case 'Fade in':
            model.textAnimation = 'fade-in--' + animationDistance;
            break;
        default:
            model.textAnimation = '';
    }

    return new Template('experience/components/commerce_assets/imageAndText').render(model).text;
};
