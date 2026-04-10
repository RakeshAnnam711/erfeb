'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

function setWidthClass(breakpoint, widthData) {
    var colClassName = '';

    if(widthData != 'Default') {
        var widthSize = widthData.split('/')[0];
        if(breakpoint === 'sm') {
            colClassName = 'col-' + widthSize;
        } else {
            colClassName = 'col-' + breakpoint + '-' + widthSize;
        }
    }

    return colClassName;
}

/**
 * Render logic for the storefront. Variable default columns for mobile, tablet, and desktop layouts
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The template to render
 */

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var component = context.component;

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    model.containerClass = content.containerClass ? content.containerClass : '';
    model.title = content.textHeadline ? content.textHeadline : null;
    model.titleAlign = content.textHeadlineAlignment;
    model.titleClass = content.textHeadlineClass ? content.textHeadlineClass : '';

    model.marginTop = content.marginTop || content.marginTop === 0 ? content.marginTop + 'px' : null;
    model.marginBottom = content.marginBottom || content.marginBottom === 0 ? content.marginBottom + 'px' : null;
    model.fullBleed = content.fullBleed === true ? true : false;

    var baseGridColumns = 12;
    var numberOfGridItems = 0;
    var mobileDefaultColumnsClass = 'col-' + baseGridColumns/content.smDefaultColumns;
    var tabletDefaultColumnsClass = 'col-md-' + baseGridColumns/content.mdDefaultColumns;
    var desktopDefaultColumnsClass = 'col-lg-' + baseGridColumns/content.lgDefaultColumns;
    var removeGutterClass = content.noGutters ? 'no-gutters': '';

    if (model.regions && model.regions.gridItems) {
        model.regions.gridItems.setClassName('flex-grid row ' + removeGutterClass);

        numberOfGridItems = model.regions.gridItems.region.size;
        var visibleGridItems = model.regions.gridItems.region.visibleComponents;
    }
    for (var i = 0; i < numberOfGridItems; i++) {
        var itemContainerClass = visibleGridItems[i].getAttribute('containerClass') || '';
        var mobileCustomColumnsClass = setWidthClass('sm', visibleGridItems[i].getAttribute('smWidth'));
        var tabletCustomColumnsClass = setWidthClass('md', visibleGridItems[i].getAttribute('mdWidth'));
        var desktopCustomColumnsClass = setWidthClass('lg', visibleGridItems[i].getAttribute('lgWidth'));
        var mobileColumnsClass = mobileCustomColumnsClass ? mobileCustomColumnsClass : mobileDefaultColumnsClass;
        var tabletColumnsClass = tabletCustomColumnsClass ? tabletCustomColumnsClass : tabletDefaultColumnsClass;
        var desktopColumnsClass = desktopCustomColumnsClass ? desktopCustomColumnsClass : desktopDefaultColumnsClass;

        var verticalPosition = visibleGridItems[i].getAttribute('verticalPosition');
        var verticalPositionClass = '';

        switch (verticalPosition) {
            case 'Top':
                verticalPositionClass = 'align-self-start';
                break;
            case 'Middle':
                verticalPositionClass = 'align-self-center';
                break;
            case 'Bottom':
                verticalPositionClass = 'align-self-end';
                break;
            case 'Fill Height':
                verticalPositionClass = 'align-self-stretch';
                break;
            default:
                verticalPositionClass = '';
        }

        var itemClassString = 'flex-grid-item ' + mobileColumnsClass + ' ' + tabletColumnsClass + ' ' + desktopColumnsClass + ' ' + verticalPositionClass + ' ' + itemContainerClass;

        model.regions.gridItems.setComponentAttribute('class', itemClassString, { position: i });
    }

    return new Template('experience/components/flexible_grid_system/flexibleGrid').render(model).text;
 };
