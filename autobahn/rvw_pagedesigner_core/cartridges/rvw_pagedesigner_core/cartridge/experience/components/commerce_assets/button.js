'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var VideoHelper = require('*/cartridge/scripts/experience/utilities/videoHelper.js');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for assets.button.
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
    model.containerClass = content.containerClass || '';
    model.buttonText = content.buttonText;
    model.buttonStyle = content.buttonStyle === 'Text Link' ? 'text-link' : 'btn btn-' + content.buttonStyle.toLowerCase();
    model.buttonClass = content.buttonClass || '';

    model.modalID = 'modal-'+model.componentID;
    model.modalClass = content.modalClass || '';
    model.modalTitle = content.modalTitle || '';

    if (content.buttonAction) {
        model.buttonAction = content.buttonAction;
        model.isExternalLink = content.buttonAction.indexOf(request.httpHost) === -1;
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

    model.regions = PageRenderHelper.getRegionModelRegistry(context.component);

    return new Template('experience/components/commerce_assets/button').render(model).text;
};
