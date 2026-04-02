'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');
var PageMgr = require('dw/experience/PageMgr');

var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
var Context = require('*/cartridge/experience/utilities/context.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var parentPageId;

    // get data from parent page
    if ('params' in request.httpParameters && !empty(request.httpParameters.params)) {
        var requestParams = request.httpParameters.params[0];
        var paramsObject = JSON.parse(requestParams);
        var customParams = paramsObject['custom'];
        var customParamsObject = JSON.parse(customParams);
        var queryString = customParamsObject.queryString;
        var queryStringObject = queryString.split("&").reduce(function(previous, current, index, array) {
            var param = current.split("=");
            previous[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
            return previous;
        }, {});

        parentPageId = queryStringObject['pageid'] || queryStringObject['cid'];
        var parentPage = PageMgr.getPage(parentPageId);
        var tileImage = parentPage.getAttribute('tileImage');

        if (!empty(tileImage)) {
            var formatParams = {
                scaleWidth: ContentImageBreakpoints.tablet,
                scaleMode: 'fit',
                format: 'jpg'
            }
            model.tileImage = URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, null, tileImage.path, formatParams) || null;
        }

        model.parentPageId = parentPageId;
        model.title = parentPage.name || null;
        model.escapedTitle = encodeURIComponent(model.title) || null;
        model.escapedUrl = encodeURIComponent(URLUtils.https('Page-Show', 'cid', parentPageId));

    } else {
        // for display when not in context of a parent page
        model.title = 'Sample Title';
        model.escapedTitle = encodeURIComponent(model.title);
        model.escapedUrl = encodeURIComponent(URLUtils.https('Page-Show', 'cid', 'sample'));
    }

    model.containerClass = content.containerClass || '';
    model.hidePinterest = content.hidePinterest || false;
    model.hideFacebook = content.hideFacebook || false;
    model.hideTwitter = content.hideTwitter || false;
    model.hideShareLink = content.hideShareLink || false;

    return new Template('experience/components/commerce_layouts/blog/socialIcons').render(model).text;
};
