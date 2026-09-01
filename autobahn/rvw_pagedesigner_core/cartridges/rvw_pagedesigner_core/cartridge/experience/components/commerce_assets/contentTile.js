'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Logger = require('dw/system/Logger');
var ContentMgr = require('dw/content/ContentMgr');
var PageMgr = require('dw/experience/PageMgr');

var GetContentTile = require('*/cartridge/models/search/contentSearch').GetContentTile;
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.contentTile component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var assetId = content.assetId;
    var asset = ContentMgr.getContent(assetId) || PageMgr.getPage(assetId);

    if (asset) {
        model.asset = new GetContentTile(asset);
    } else {
        Logger.error('Asset ID "' + assetId + '" not found');
    }

    return new Template('experience/components/commerce_assets/contentTile').render(model).text;
};
