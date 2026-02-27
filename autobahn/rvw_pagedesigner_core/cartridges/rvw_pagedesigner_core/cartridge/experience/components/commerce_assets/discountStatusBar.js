'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var discountStatusBarHelper = require('*/cartridge/scripts/experience/utilities/discountStatusBarHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the assets.discountStatusBar.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var campaignId = content.campaignId || null;
    var data = discountStatusBarHelper.getData(campaignId);

    model.checkpoints = data.checkpoints;
    model.total = data.total;
    model.fillPercentage = data.fillPercentage;
    model.containerClass = content.containerClass || '';
    model.campaignId = campaignId;
    model.buttonText = content.buttonText || '';
    model.completionMessage = content.completionMessage || '';

    return new Template('experience/components/commerce_assets/discountStatusBar').render(model).text;
};
