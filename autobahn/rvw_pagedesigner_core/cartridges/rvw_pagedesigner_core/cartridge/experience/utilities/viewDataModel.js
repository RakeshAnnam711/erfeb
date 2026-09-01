'use strict';

var HashMap = require('dw/util/HashMap');

var QueryString = require('server/queryString');
var ABConfigsHelper = require('*/cartridge/scripts/helpers/abConfigsHelper.js');
var SiteContextHelper = require('*/cartridge/scripts/helpers/siteContextHelper');

module.exports = function (context, modelIn) {
    var model = modelIn || new HashMap();

    // PD internal cache control querystring
    model.pageDesignerQuerystring = new QueryString(request.httpQueryString || '');

    var bm_RequestObj = {
        host: request.httpHost,
        httpHeaders: request.httpHeaders,
        httpParameterMap: request.httpParameterMap,

        querystring: {},
        session: {
            raw: session
        }
    };

    if ('page' in context) {
        model.page = context.page;
    }

    // build viewData pushed to pageDesigner from 'res.push(...)' command from controller
    if ('params' in request.httpParameterMap && !request.httpParameterMap.params.empty) {
        var renderParams = JSON.parse(request.httpParameterMap.params);

        if (renderParams.custom && typeof renderParams.custom === 'string') renderParams = JSON.parse(renderParams.custom);

        Object.keys(renderParams).forEach(function(key) {
            model.put(key,renderParams[key]);
        });
    }

    if (!empty(model.abConfigs) && Object.keys(model.abConfigs).length === 0) model.abConfigs = null;

    if (!empty(model.siteContext) && Object.keys(model.siteContext).length === 0) model.siteContext = null;

    // Querystring from orignal Controllers calling PD
    model.queryString = new QueryString(model.queryString || '');
    bm_RequestObj.querystring = model.queryString;

    // Minimal viewData object into templates
    model.abConfigs = model.abConfigs || ABConfigsHelper.getABConfigs(model);
    model.siteContext = model.siteContext || SiteContextHelper.getSiteContext(bm_RequestObj);

    return model;
}
