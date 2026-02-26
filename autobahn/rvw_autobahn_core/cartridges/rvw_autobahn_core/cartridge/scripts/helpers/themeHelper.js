'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');

function getCategoryTheme(queryString) {
    var categoryId = module.exports.getQueryVariable(queryString, 'cgid');

    if (!empty(categoryId)) {
        var category = CatalogMgr.getCategory(categoryId);

        if (!empty(category)) {
            var parentCategory = category;

            while (!parentCategory.root) {
                if (!empty(parentCategory.custom.theme)) {
                    return parentCategory.custom.theme;
                } else {
                    parentCategory = parentCategory.parent;
                }
            }
        }
    }

    return null;
}

function getQueryVariable(queryString, variable) {
    if (!empty(queryString)) {
        var vars = queryString.split('&');

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    }

    return null;
}


/**
 * Returns the theme
 *
 * @returns {Object} - The theme object
 */
function getTheme(pdict) {
    var theme = { exists: false };
    var categoryTheme = module.exports.getCategoryTheme(pdict.queryString);
    var pageDesignerPreviewTheme = pdict.theme;

    if (!empty(categoryTheme) || !empty(pageDesignerPreviewTheme)) {
        var themePath = categoryTheme || pageDesignerPreviewTheme; // source code theme takes precedence
        themePath = themePath.substring(themePath.lastIndexOf('.') + 1) === 'css' ? themePath : themePath + '.css'; // check for .css extension
        var filePath = '/css/' + themePath;
        theme.exists = true;
        theme.src = filePath;
    }

    return theme;
}

module.exports = {
    getCategoryTheme: getCategoryTheme,
    getQueryVariable: getQueryVariable,
    getTheme: getTheme
}
