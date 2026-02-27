'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storefront. Hover Switch layout
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} Then template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;

    model.customClass = content.customClass || '';
    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    return new Template('experience/components/commerce_layouts/hoverSwitch').render(model).text;
};
