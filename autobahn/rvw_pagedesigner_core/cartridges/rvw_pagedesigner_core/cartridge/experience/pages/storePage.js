'use strict';
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var Url = require('*/cartridge/experience/utilities/url.js');
var Cache = require('*/cartridge/experience/utilities/cache.js');
var Context = require('*/cartridge/experience/utilities/context.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storepage.
 *
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var pageMetaData = PageRenderHelper.getPageMetaData(model.page);
    var navFolderId = content.navFolderId && 'value' in content.navFolderId ? content.navFolderId.value : null;

    // Apply response cache
    Cache.applyDefaultCache(response);

    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(model.page);

    // Custom page attributes
    model.transparentNavShow = content.transparentNavShow;
    model.transparentNavDarkMode = content.transparentNavDarkMode;
    model.customClass = content.customClass || '';
    model.chromeless = content.chromeless || false;

    // set up for folder-based navigation if a folder is selected
    model.hasFolderBasedNav = navFolderId !== null && navFolderId !== 'root';
    if (model.hasFolderBasedNav) {
        var contentSubfolders = require('*/cartridge/scripts/util/getContentSubfolders');
        var contentArray = contentSubfolders.GetFolders(navFolderId);
        var mobilePlacement = content.folderNavMobilePlacement || 'Top';
        var desktopPlacement = content.folderNavDesktopPlacement || 'Left';

        model.ContentFolders = contentArray.ContentFolders;
        model.folderNavClasses = {
            mobileNav: mobilePlacement === "Top" ? 'order-1' : 'order-2',
            mobileContent: mobilePlacement === "Top" ? 'order-2' : 'order-1',
            desktopNav: desktopPlacement === "Left" ? 'order-md-1' : 'order-md-2',
            desktopContent: desktopPlacement === "Left" ? 'order-md-2' : 'order-md-1'
        }
    }

    // adding CurrentHttpParameterMap to the pdict so we don't break certain link cartridges
    model.CurrentHttpParameterMap = request.httpParameterMap;

    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
        model.theme = content.theme || '';
        model.CurrentPageMetaData = pageMetaData;
    } else if (!model.chromeless) {
        // get metadata from page settings, falling back to page metatag rules
        model.CurrentPageMetaData.title = pageMetaData.title || model.CurrentPageMetaData.title;
        model.CurrentPageMetaData.description = pageMetaData.description || model.CurrentPageMetaData.description;
        model.CurrentPageMetaData.keywords = pageMetaData.keywords || model.CurrentPageMetaData.keywords;
    }

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
    }

    // Add PDP content to viewdata in case of PDP components on non-PDP pages
    Context.addContext(model.queryString || null);
    Context.addContext(model.breadcrumbs || null);
    Context.addContext(null);
    Context.addContext(model.yotpoWidgetData || null);

    // render the page
    var ajaxRegion = Url.getUrlParameter('ajaxRegion', '?' + model.queryString); // populated when page is requested via ajax
    if (!empty(ajaxRegion) && ajaxRegion in model.regions) {
        model.ajaxRegion = ajaxRegion;
        return new Template('experience/pages/ajaxRegion').render(model).text;
    } else if (model.chromeless && !PageRenderHelper.isInEditMode()) {
        return new Template('experience/pages/chromeless').render(model).text;
    } else {
        // Add schema for structured data
        var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');
        model.schemaData = schemaHelper.getContentPageSchema(model);

        // Check for contents in belowFold region
        model.belowFoldPopulated = model.regions.belowFold.region.size > 0;

        // Update template if folder-based nav preference is enabled
        var template = model.hasFolderBasedNav ? 'experience/pages/storePageFolderNav' : 'experience/pages/storePage'

        return new Template(template).render(model).text;
    }
};
