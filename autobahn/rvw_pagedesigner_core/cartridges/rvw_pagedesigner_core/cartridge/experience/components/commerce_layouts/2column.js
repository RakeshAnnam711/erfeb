'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageMgr = require('dw/experience/PageMgr');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var collections = require('*/cartridge/scripts/util/collections');
var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storefront. 2 Row x 1 Col (Mobile) 1 Row x 2 Col (Desktop) layout
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} Then template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;
    var pageId = request.httpParameters.cid[0];
    var page = PageMgr.getPage(pageId);
    var pageRegions = PageRenderHelper.getRegionModelRegistry(page);
    var visiblePageComponents = pageRegions.main.region.visibleComponents;
    var sharedColumnClass = 'region';
    var column1Class = '';
    var column2Class = '';

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

    switch(content.alignCols) {
        case 'Stretch':
            sharedColumnClass += ' align-self-stretch';
            break;
        case 'Top':
            sharedColumnClass += ' align-self-start';
            break;
        case 'Center':
            sharedColumnClass += ' align-self-center';
            break;
        case 'Bottom':
            sharedColumnClass += ' align-self-end';
            break;
        default: // center
            sharedColumnClass += ' align-self-center';
    }

    var twoColumnsOnMobile = false;
    if (content.column1MobilePlacement === 'Bottom') {
        column1Class += ' col-12 order-2 order-md-1';
        column2Class += ' col-12 order-1 order-md-2';
    } else {
        if (content.mobileColumns === '1 row, 2 columns') {
            twoColumnsOnMobile = true;
            sharedColumnClass += ' col-6';
        } else {
            sharedColumnClass += ' col-12';
        }
    }

    switch(content.column1Width) {
        case '1/12':
            column1Class += ' col-md-1';
            column2Class += ' col-md-11';
            break;
        case '2/12':
            column1Class += ' col-md-2';
            column2Class += ' col-md-10';
            break;
        case '3/12':
            column1Class += ' col-md-3';
            column2Class += ' col-md-9';
            break;
        case '4/12':
            column1Class += ' col-md-4';
            column2Class += ' col-md-8';
            break;
        case '5/12':
            column1Class += ' col-md-5';
            column2Class += ' col-md-7';
            break;
        case '6/12':
            column1Class += ' col-md-6';
            column2Class += ' col-md-6';
            break;
        case '7/12':
            column1Class += ' col-md-7';
            column2Class += ' col-md-5';
            break;
        case '8/12':
            column1Class += ' col-md-8';
            column2Class += ' col-md-4';
            break;
        case '9/12':
            column1Class += ' col-md-9';
            column2Class += ' col-md-3';
            break;
        case '10/12':
            column1Class += ' col-md-10';
            column2Class += ' col-md-2';
            break;
        case '11/12':
            column1Class += ' col-md-11';
            column2Class += ' col-md-1';
            break;
        default: // 6/12
            column1Class += ' col-md-6';
            column2Class += ' col-md-6';
    }

    if (content.noPaddingCol) {
        if (twoColumnsOnMobile) {
            column1Class += ' pr-0';
            column2Class += ' pl-0';
        } else { // 1 column on mobile
            column1Class += ' pr-md-0';
            column2Class += ' pl-md-0 mt-0';
        }
    }

    model.column1Class = sharedColumnClass + column1Class;
    model.column2Class = sharedColumnClass + column2Class;

    // animations
    var animationDistance = content.animationDistance.toLowerCase();
    model.col1AnimationDelay = content.col1AnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.col2AnimationDelay = content.col2AnimationDelay || SiteConstants.ComponentAnimationDelay;
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

    return new Template('experience/components/commerce_layouts/2column').render(model).text;
};
