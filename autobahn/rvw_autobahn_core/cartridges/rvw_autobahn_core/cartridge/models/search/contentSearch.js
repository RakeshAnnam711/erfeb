// Copied over from base to add to getContentSearchPageJSON internal function
'use strict';

var PagingModel = require('dw/web/PagingModel');
var URLUtils = require('dw/web/URLUtils');
var PageMgr = require('dw/experience/PageMgr');
var preferences = require('*/cartridge/config/preferences');
var ACTION_ENDPOINT_GRID = 'Search-Content';
var ACTION_ENDPOINT_CONTENT = 'Page-Show';
var DEFAULT_PAGE_SIZE = preferences.defaultPageSize ? preferences.defaultPageSize : 12;

/**
 * Configures and returns a PagingModel instance
 *
 * @param {dw.util.Iterator} contentHits - Iterator for content search results
 * @param {number} count - Number of contents in search results, IGNORED for modified search rules
 * @param {number} pageSize - Number of contents to display
 * @param {number} startIndex - Beginning index value
 * @return {dw.web.PagingModel} - PagingModel instance
 */
function getPagingModel(contentHits, count, pageSize, startIndex, includeHidden) {
    var ArrayList = require('dw/util/ArrayList');
    var collections = require('*/cartridge/scripts/util/collections');
    var refinedContentHits = new ArrayList();

    collections.forEach(contentHits.asList(), function(contentAsset) {
        var page = contentAsset && contentAsset.page ? PageMgr.getPage(contentAsset.ID) : null;

        if (includeHidden || !page || page.isVisible()) {
            refinedContentHits.add(contentAsset);
        }
    });

    var pagingModel = new PagingModel(refinedContentHits.iterator(), refinedContentHits.getLength());
    pagingModel.setStart(startIndex || 0);
    pagingModel.setPageSize(pageSize);

    return pagingModel;
}

/**
 * Transforms a page of content into an array of JSON objects
 * @param {{dw.util.List}} pageElements - PagingModel page of content
 * @return {Array} - page of content JSON objects
 */
function getContentSearchPageJSON(pageElements) {
    var collections = require('*/cartridge/scripts/util/collections');

    return collections.map(pageElements, function(contentAsset) {
        return module.exports.GetContentTile(contentAsset);
    });
}

/**
 * @constructor
 * @classdesc ContentSearch class
 * @param {dw.util.Iterator<dw.content.Content>} contentSearchResult - content iterator
 * @param {number} count - number of contents in the results
 * @param {string} queryPhrase - request queryPhrase
 * @param {number} startingPage - The index for the start of the content page
 * @param {number | null} pageSize - The index for the start of the content page
 * @param {boolean | null} includeHidden - include hidden page designer assets
 *
 */
function ContentSearch(contentSearchResult, count, queryPhrase, startingPage, pageSize, includeHidden) {
    var ps = pageSize == null ? DEFAULT_PAGE_SIZE : pageSize;
    var pagingModel = module.exports.getPagingModel(contentSearchResult, count, ps, startingPage, includeHidden);
    var contents = module.exports.getContentSearchPageJSON(pagingModel.pageElements.asList());
    var moreContentUrl = pagingModel.maxPage > pagingModel.currentPage
        ? URLUtils.url(ACTION_ENDPOINT_GRID, 'q', queryPhrase, 'startingPage', pagingModel.end + 1)
        : null;
    this.queryPhrase = queryPhrase;
    this.contents = contents;
    this.contentCount = pagingModel.count;
    this.moreContentUrl = moreContentUrl;
    this.hasMessage = parseInt(startingPage) === 0; // fix for bug in base SFRA - startingPage is a string
}

/**
 * Get a JSON object representing a Content Tile
 * @param {object} Page - Page or Content Asset
 * @return {object} - New Content Tile object
 */
function GetContentTile(contentAsset) {
    var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
    var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
    var collections = require('*/cartridge/scripts/util/collections');
    var page = PageMgr.getPage(contentAsset.ID);
    var contentObject = {
        id: contentAsset.ID,
        name: contentAsset.name,
        url: URLUtils.url(ACTION_ENDPOINT_CONTENT, 'cid', contentAsset.ID),
        description: contentAsset.description,
        creationDate: 'creationDate' in contentAsset ? contentAsset.creationDate : null
    }
    // Optimize image or use fallback and add to content object
    var placeholderImage = {
        path: SiteConstants.placeholderImagePaths.imageMissing,
        focal_point: {
            x: .5,
            y: .5
        }
    }
    var tileImage = page != null && page.isVisible() ? page.getAttribute('tileImage') || placeholderImage : placeholderImage;
    var formatParams = {
        scaleWidth: ContentImageBreakpoints.mobile,
        scaleMode: 'fit',
        format: 'jpg'
    }
    contentObject.tileImage = {
        src: URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, null, tileImage.path, formatParams),
        focalPointX: (tileImage.focal_point.x * 100) + '%',
        focalPointY: (tileImage.focal_point.y * 100) + '%',
        alt: contentAsset.name
    }

    contentObject.isBlog = page !== null && page.typeID === 'blogPage';

    // Add extra attributes for blogs
    if (contentObject.isBlog && page.isVisible()) {
        var blogCreationDate = page.getAttribute('blogCreationDate');
        var publishDate;

        // Fall back to today's date if no date exists on page
        if (blogCreationDate) {
            publishDate = new Date(page.getAttribute('blogCreationDate').value);
        } else {
            publishDate = new Date();
        }

        if (!empty(page.searchWords)) {
            var searchWordsArray = page.searchWords.split(',');

            for (var i = 0; i < searchWordsArray.length; i++) {
                searchWordsArray[i] = searchWordsArray[i].trim();
            }

            contentObject.searchWords = searchWordsArray;
        }

        // Format date for display on content tile
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = monthNames[publishDate.getMonth()];
        var day = publishDate.getDate();
        var year = publishDate.getYear();
        contentObject.publishDate = publishDate;
        contentObject.publishDateDisplay = month + ' ' + day + ', ' + year;

        // Get the display name for the category ID
        var blogCategory = '';
        collections.forEach(page.folders, function(folder, index) {
            blogCategory = blogCategory + (index === 0 ? '' : ', ') + folder.displayName;
        });

        contentObject.categoryName = blogCategory;
    }

    return contentObject;
}

module.exports = {
    ContentSearch: ContentSearch,
    GetContentTile: GetContentTile,
    getPagingModel: getPagingModel,
    getContentSearchPageJSON: getContentSearchPageJSON
}
