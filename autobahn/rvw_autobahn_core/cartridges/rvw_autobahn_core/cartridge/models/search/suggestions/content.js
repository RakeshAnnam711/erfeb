'use strict';

var URLUtils = require('dw/web/URLUtils');
var PageMgr = require('dw/experience/PageMgr');

/**
 * Get Tile URL
 *
 * @param {dw.catalog.Content} content - Suggested content
 * @return {string} - Image URL
 */
function getImageUrl(content) {
    var page = PageMgr.getPage(content.ID);
    var imageUrl = null;
    if (page) {
        var contentImage = page.getAttribute('tileImage') || null;
        var thumbnailImageParams = {scaleWidth: 100, scaleHeight: 100};
        imageUrl = contentImage ? URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, null, contentImage.path, thumbnailImageParams) : null;
    }

    return imageUrl;
}

/**
 * Check if is Page Designer page and is visible
 *
 * @param {dw.catalog.Content} content - Suggested content
 * @return {boolean}
 */
function isVisible(content) {
    var page = PageMgr.getPage(content.ID);
    return page && !page.visible ? false : true;
}

/**
 * @constructor
 * @classdesc ContentSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of content items to retrieve
 */
function ContentSuggestions(suggestions, maxItems) {
    this.contents = [];

    if (!suggestions.contentSuggestions) {
        this.available = false;
        return;
    }

    var contentSuggestions = suggestions.contentSuggestions;
    var iter = contentSuggestions.suggestedContent;

    this.available = contentSuggestions.hasSuggestions();

    for (var i = 0; i < maxItems; i++) {
        var content;

        if (iter.hasNext()) {
            content = iter.next().content;
            if (isVisible(content)) {
                this.contents.push({
                    name: content.name,
                    imageUrl: getImageUrl(content),
                    url: URLUtils.url('Page-Show', 'cid', content.ID)
                });
            }
        }
    }
}

module.exports = ContentSuggestions;
