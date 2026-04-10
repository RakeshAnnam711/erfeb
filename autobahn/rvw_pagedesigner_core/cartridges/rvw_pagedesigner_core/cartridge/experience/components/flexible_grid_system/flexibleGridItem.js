'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the assets.flexibleGridItem
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var component = context.component;

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    if (model.regions && model.regions.embeddedComponent) {
        model.regions.embeddedComponent.setClassName('flex-grid-embedded-component');

        if (content.itemPadding) {
            model.regions.embeddedComponent.setAttribute('style', 'padding:' + content.itemPadding + ';');
        }
    }

    model.containerClass = content.containerClass ? content.containerClass : '';

    return new Template('experience/components/flexible_grid_system/flexibleGridItem').render(model).text;
};
