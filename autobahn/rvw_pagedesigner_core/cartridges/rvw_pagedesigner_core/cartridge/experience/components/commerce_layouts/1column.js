'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageMgr = require('dw/experience/PageMgr');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var collections = require('*/cartridge/scripts/util/collections');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storefront. 1 Row x 1 Col (Mobile) 1 Row x 1 Col (Desktop) layout that goes full width across the page up to 1440px wide
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;
    var pageId = request.httpParameters.cid[0];
    var page = PageMgr.getPage(pageId);
    var pageRegions = PageRenderHelper.getRegionModelRegistry(page);
    var visiblePageComponents = pageRegions.main.region.visibleComponents;

    // check the position on the page for assigning to data attribute
    model.componentID = context.component.ID;
    model.componentIndex = 0;
    collections.forEach(visiblePageComponents, function(item, index) {
        if (item.ID === model.componentID) {
            model.componentIndex = index;
        }
    });

    model.containerBackgroundColor = content.containerBackgroundColor || '';
    model.customClass = content.customClass || '';
    model.marginTop = content.marginTop || content.marginTop === 0 ? content.marginTop + 'px' : null;
    model.marginBottom = content.marginBottom || content.marginBottom === 0 ? content.marginBottom + 'px' : null;
    model.fullBleed = content.fullBleed === true ? true : false;
    model.backgroundImage = null;

    if (content.backgroundImage) {
        model.backgroundImage = {
            alt: content.backgroundImage.file.getAlt() || '',
            focalPointX: (content.backgroundImage.focalPoint.x * 100) + '%',
            focalPointY: (content.backgroundImage.focalPoint.y * 100) + '%',
            src: {
                mobile: ImageTransformation.url(content.backgroundImage, { device: 'mobile' }),
                mobile2x: ImageTransformation.url(content.backgroundImage, { device: 'mobile2x' }),
                tablet: ImageTransformation.url(content.backgroundImage, { device: 'tablet' }),
                tablet2x: ImageTransformation.url(content.backgroundImage, { device: 'tablet2x' }),
                desktop: ImageTransformation.url(content.backgroundImage, { device: 'desktop' }),
                desktop2x: ImageTransformation.url(content.backgroundImage, { device: 'desktop2x' })
            }
        };
    }

    // animations
    var animationDistance = content.animationDistance.toLowerCase();
    model.animationDelay = content.animationDelay || SiteConstants.ComponentAnimationDelay;
    model.animationPlayOnce = content.animationPlayOnce || false;
    model.disableMobileAnimation = content.disableMobileAnimation || false;

    switch (content.animation) {
        case 'Zoom in':
            model.animation = 'scale-in-center--' + animationDistance;
            break;
        case 'Hinge drop':
            model.animation = 'hinge-drop--' + animationDistance;
            break;
        case 'Flip in top':
            model.animation = 'flip-in-hor-top--' + animationDistance;
            break;
        case 'Flip in bottom':
            model.animation = 'flip-in-hor-bottom--' + animationDistance;
            break;
        case 'Slide in from top':
            model.animation = 'slide-in-top--' + animationDistance;
            break;
        case 'Slide in from left':
            model.animation = 'slide-in-left--' + animationDistance;
            break;
        case 'Slide in from right':
            model.animation = 'slide-in-right--' + animationDistance;
            break;
        case 'Slide in from bottom':
            model.animation = 'slide-in-bottom--' + animationDistance;
            break;
        case 'Fade in':
            model.animation = 'fade-in--' + animationDistance;
            break;
        default:
            model.animation = '';
    }

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    return new Template('experience/components/commerce_layouts/1column').render(model).text;
};
