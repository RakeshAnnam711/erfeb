'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ContentMgr = require('dw/content/ContentMgr');

var sliderBuilder = require('*/cartridge/scripts/experience/utilities/sliderBuilder.js');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.carousel layout.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var resultLimit = content.resultLimit || 12;
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteRootFolder = siteLibrary.getRoot();
    var folderId = content.folderId && 'value' in content.folderId ? content.folderId.value : siteRootFolder.ID;
    var startingPage = 0;
    var searchParams = {
        q: folderId,
        context: 'folder', // enables searching by folder instead of search phrase
        pageSize: 10000, // hard-coding to large value to support custom sort and pagination (SFRA does not support sorting on PD attributes)
        startingPage: startingPage
    }
    var contentSearch = searchHelper.setupContentSearch(searchParams);
    searchHelper.sortContentResults(contentSearch.contents);
    contentSearch.contents.splice(resultLimit); // truncate to max results set in resultLimit attribute

    model.useGrid = content.useGrid || false;

    if (model.useGrid) {
        model.containerClass = context.content.containerClass || '';
        model.title = context.content.textHeadline ? context.content.textHeadline : null;
        model.titleAlign = context.content.textHeadlineAlignment;
        model.titleClass = context.content.textHeadlineClass || '';
        model.customStartingPage = startingPage;
        model.resultLimit = resultLimit;
        model.pageMax = content.pageMax || resultLimit;

        searchHelper.paginateContentResults(contentSearch, startingPage, model.pageMax);

        model.contentSearch = contentSearch;

        var columnClass;

        switch(content.smGridColumns) {
            case 1:
                columnClass = 'col-12';
                break;
            case 2:
                columnClass = 'col-6';
                break;
            case 3:
                columnClass = 'col-4';
                break;
            default:
                columnClass = 'col-12';
        }
        switch(content.mdGridColumns) {
            case 1:
                columnClass = columnClass + ' col-md-12';
                break;
            case 2:
                columnClass = columnClass + ' col-md-6';
                break;
            case 3:
                columnClass = columnClass + ' col-md-4';
                break;
            case 4:
                columnClass = columnClass + ' col-md-3';
                break;
            case 6:
                columnClass = columnClass + ' col-md-2';
                break;
            default:
                columnClass = columnClass + ' col-md-4';
        }
        switch(content.lgGridColumns) {
            case 1:
                columnClass = columnClass + ' col-lg-12';
                break;
            case 2:
                columnClass = columnClass + ' col-lg-6';
                break;
            case 3:
                columnClass = columnClass + ' col-lg-4';
                break;
            case 4:
                columnClass = columnClass + ' col-lg-3';
                break;
            case 6:
                columnClass = columnClass + ' col-lg-2';
                break;
            default:
                columnClass = columnClass + ' col-lg-3';
        }

        model.columnClass = columnClass;
    } else {
        model.contentSearch = contentSearch;
        model = sliderBuilder.init(model, context);
    }


    return new Template('experience/components/commerce_layouts/contentSlider').render(model).text;
};
