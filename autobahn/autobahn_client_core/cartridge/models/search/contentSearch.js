'use strict';

var base = module.superModule;

var URLUtils = require('dw/web/URLUtils');
var PageMgr = require('dw/experience/PageMgr');
var ACTION_ENDPOINT_CONTENT = 'Page-Show';

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
    contentObject.tileImage = {
        src: URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, null, tileImage.path, {format: 'WebP', quality: 80, sw: 750, sh: 500}),
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

base.GetContentTile = GetContentTile;

module.exports = base;
