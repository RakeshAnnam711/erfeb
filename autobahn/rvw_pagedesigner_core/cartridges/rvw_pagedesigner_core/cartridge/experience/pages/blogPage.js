'use strict';
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Resource = require('dw/web/Resource');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var collections = require('*/cartridge/scripts/util/collections');
var folderHelpers = require('*/cartridge/scripts/helpers/folderHelpers.js');
var Cache = require('*/cartridge/experience/utilities/cache.js');
var Context = require('*/cartridge/experience/utilities/context.js');
var Url = require('*/cartridge/experience/utilities/url.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

function getFormattedDate(date, blogDynamicData) {
    var dateObject = new Date(date.value);
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var month = monthNames[dateObject.getMonth()];
    var day = dateObject.getDate();
    var year = dateObject.getYear();
    blogDynamicData.creationDate = month + ' ' + day + ', ' + year;
}

/**
 * Render logic for the product detail page.
 *
 * @param {dw.experience.PageScriptContext} context The page script context object.
 *
 * @returns {string} The template text
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var pageMetaData = PageRenderHelper.getPageMetaData(model.page);

    // Apply response cache
    Cache.applyDefaultCache(response);

    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(model.page);

    // add data for use in blogTitle component
    var blogDynamicData = {
        title: model.page.name,
        id: model.page.ID,
        author: content.blogAuthor || ''
    };

    // build out blog categories for top nav based on default assigned folder
    var classificationFolder = model.page.getClassificationFolder();
    var blogCategories = null;
    if (classificationFolder) {
        var blogData = folderHelpers.getBlogData(classificationFolder.ID);
        blogCategories = folderHelpers.getSubFolders(blogData.rootFolderId);
        model.rootFolderId = blogData.rootFolderId; // used for 'all' link in category nav
    }

    var blogCreationDate = content.blogCreationDate || { value: new Date().toISOString() };

    if (model.page.folders) {
        var blogCategory = '';
        collections.forEach(model.page.folders, function(folder, index) {
            // concatenate all assigned folders for display in blog subtitle
            blogCategory = blogCategory + (index === 0 ? '' : ', ') + folder.displayName;
        });
        blogDynamicData.categoryName = blogCategory;
    }

    getFormattedDate(blogCreationDate, blogDynamicData);

    if (!empty(model.page.searchWords)) {
        var searchWordsArray = model.page.searchWords.split(',');

        for (var i = 0; i < searchWordsArray.length; i++) {
            searchWordsArray[i] = searchWordsArray[i].trim();
        }

        blogDynamicData.searchWords = searchWordsArray;
        model.searchWords = searchWordsArray;
    }

    // Add PDP content to viewdata in case of PDP components on non-PDP pages
    Context.addContext(model.queryString || null);
    Context.addContext(model.breadcrumbs || null);
    Context.addContext(null);
    Context.addContext(model.yotpoWidgetData || null);

    Context.addContext(blogDynamicData); // allows retreiving blogDynamicData from blogTitle component

    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
        model.CurrentPageMetaData = pageMetaData;
    } else {
        // get metadata from page settings, falling back to page metatag rules
        model.CurrentPageMetaData.title = pageMetaData.title || model.CurrentPageMetaData.title;
        model.CurrentPageMetaData.description = pageMetaData.description || model.CurrentPageMetaData.description;
        model.CurrentPageMetaData.keywords = pageMetaData.keywords || model.CurrentPageMetaData.keywords;
    }

    // Custom page attributes
    model.isBlogPage = true;
    model.blogCategories = blogCategories;
    model.transparentNavShow = content.transparentNavShow;
    model.transparentNavDarkMode = content.transparentNavDarkMode;
    model.customClass = content.customClass || '';
    model.creationDate = blogDynamicData.creationDate;

    // adding CurrentHttpParameterMap to the pdict so we don't break certain link cartridges
    model.CurrentHttpParameterMap = request.httpParameterMap;

    if (content.tileImage) {
        model.tileImage = {
            alt: content.tileImage.file.getAlt() || '',
            focalPointX: (content.tileImage.focalPoint.x * 100) + '%',
            focalPointY: (content.tileImage.focalPoint.y * 100) + '%',
            height: content.tileImage.metaData.height,
            width: content.tileImage.metaData.width,
            src: ImageTransformation.url(content.tileImage, { device: 'mobile' })
        }

        var ogImage = {
            content: model.tileImage.src,
            ID: 'og:image',
            name: false,
            property: true,
            title: false
        }

        if ('CurrentPageMetaData' in model && 'pageMetaTags' in model.CurrentPageMetaData) {
            model.CurrentPageMetaData.pageMetaTags.push(ogImage);
        }
        blogDynamicData.tileImage = model.tileImage;
    }


    // Add schema for structured data
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');
    model.schemaData = schemaHelper.getContentPageSchema(model);

    // render the page
    var ajaxRegion = Url.getUrlParameter('ajaxRegion', '?' + model.queryString); // populated when page is requested via ajax
    if (!empty(ajaxRegion)) {
        model.ajaxRegion = ajaxRegion;
        return new Template('experience/pages/ajaxRegion').render(model).text;
    } else {
        model.belowFoldPopulated = model.regions.belowFold.region.size > 0; // check for contents in belowFold region
        return new Template('experience/pages/blogPage').render(model).text;
    }
};
