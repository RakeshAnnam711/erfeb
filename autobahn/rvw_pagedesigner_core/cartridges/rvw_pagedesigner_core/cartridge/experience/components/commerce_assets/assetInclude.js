'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageMgr = require('dw/experience/PageMgr');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the assets.assetInclude.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var assetId = content.assetId;

    model.containerClass = content.containerClass || '';

    // if Filter by Querystring is selected, check for a chromeless page with a current param value ID appended and show that instead
    if (!PageRenderHelper.isInEditMode() && content.queryFilter) {
        if ('params' in request.httpParameters && !empty(request.httpParameters.params)) {
            var requestParams = request.httpParameters.params[0];
            var paramsObject = JSON.parse(requestParams);
            var customParams = paramsObject['custom'];
            var customParamsObject = JSON.parse(customParams);
            var queryString = customParamsObject.queryString;

            queryString.split("&").reduce(function(previous, current) {
                var param = current.split("=");
                var paramValues = decodeURIComponent(param[1]).split('|');
                var paramValue = paramValues.pop(); // use last param value found if multiple
                var page = PageMgr.getPage(assetId + '-' + paramValue) || PageMgr.getPage(assetId + '-' + paramValue.toLowerCase());

                if (page != null && page.isVisible()) {
                    assetId = page.ID;
                }
            }, {});
        }
    }

    model.params = {
        cid: assetId,
        params: ''
    }

    if (content.params) {
        model.params.params = content.params;
    }

    return new Template('experience/components/commerce_assets/assetInclude').render(model).text;
};
