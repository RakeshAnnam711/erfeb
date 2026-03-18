'use strict';

var base = module.superModule;
var baseSearch = base.search;

/**
 * Retrieves the Category Landing Page, if available in Page Designer
 * @param {Object} categoryID - the category ID as determined from the request
 * @returns {Object} a lookup result with these fields:
 *  * page - the page that is configured for this category, if any
 *  * invisiblePage - the page that is configured for this category if we ignore visibility, if it is different from page
 *  * aspectAttributes - the aspect attributes that should be passed to the PageMgr, null if no page was found
 */
function getPageDesignerCategoryPage(categoryID) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var HashMap = require('dw/util/HashMap');

    var category = CatalogMgr.getCategory(categoryID); // Removed LowercaseID requirement for Categories

    if (category === null) {
        return {
            page: null,
            invisiblePage: null,
            aspectAttributes: null
        };
    }

    var page = PageMgr.getPageByCategory(category, true, 'plp');
    var invisiblePage = PageMgr.getPageByCategory(category, false, 'plp');

    if (page) {
        var aspectAttributes = new HashMap();
        aspectAttributes.category = category;

        return {
            page: page,
            invisiblePage: page.ID !== invisiblePage.ID ? invisiblePage : null,
            aspectAttributes: aspectAttributes
        };
    }

    return {
        page: null,
        invisiblePage: invisiblePage,
        aspectAttributes: null
    };
}

/**
 * Set content search configuration values
 *
 * @param {Object} params - Provided HTTP query parameters
 * @return {Object} - content search instance
 */
function setupContentSearch(params) {
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var ContentSearch = require('*/cartridge/models/search/contentSearch').ContentSearch;
    var apiContentSearchModel = new ContentSearchModel();
    var searchContext = params.context || null;
    var searchPhrase = params.q;
    var pageSize = params.pageSize || null;

    apiContentSearchModel.setRecursiveFolderSearch(true);

    if (searchContext === 'folder') {
        // for the blog landing page, scope results to blog folders
        apiContentSearchModel.setFolderID(searchPhrase);
    } else {
        apiContentSearchModel.setFilteredByFolder(false);
        apiContentSearchModel.setSearchPhrase(searchPhrase);
    }

    apiContentSearchModel.search();
    var contentSearchResult = apiContentSearchModel.getContent();
    var count = Number(apiContentSearchModel.getCount());
    var contentSearch = new ContentSearch(contentSearchResult, count, searchPhrase, params.startingPage, pageSize);

    return contentSearch;
}

/**
 * Custom pagination needed to handle Page Designer content
 *
 * @param {Object} contentSearch : Results of a content search
 * @param {Integer} startingPage : The starting index of content results
 * @param {Integer} customPageSize : How many content results to show per page
 * @return {Object} - updated contentSearch
 */
function paginateContentResults(contentSearch, startingPage, customPageSize) {
    var blogPageSizePreference = dw.system.Site.getCurrent().getCustomPreferenceValue('blogDefaultPageSize') || 12;
    var pageSize = customPageSize || blogPageSizePreference;
    startingPage = parseInt(startingPage, 10);
    var startIndex = startingPage * pageSize;

    contentSearch.showMoreButton = false;

    if (startingPage > 0) {
        contentSearch.contents.splice(0, startIndex); // remove from beginning
    }

    if (contentSearch.contents.length > pageSize) {
        contentSearch.contents.splice(pageSize); // remove from end
        contentSearch.showMoreButton = true;
    }
}

/**
 * Sort content results from newest to oldest
 *
 * @param {Object} resultItems - contentSearch.contents
 * @return {Object} - updated contentSearch.contents
 */
function sortContentResults(resultItems) {
    resultItems.sort(function(a, b) {
        var aDate = a.publishDate || a.creationDate;
        var bDate = b.publishDate || b.creationDate;
        return bDate - aDate;
    });
}

/**
 * Correction for Page MetaData Calculations
 *
 * @param {Object} req - Provided HTTP query parameters
 * @param {Object} res - Provided HTTP query parameters
 * @return {Object} - an object with relevant search information
 */
function search (req, res) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var result = baseSearch.apply(this, arguments);

    if (result.productSearch) {
        var categoryTemplate = base.getCategoryTemplate(result.apiProductSearch);

        // Override native base search behavior, do not limit metadata and category details to only top-level categories
        if (result.productSearch.isCategorySearch && !result.productSearch.isRefinedCategorySearch && categoryTemplate) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, result.productSearch.category);
            result.category = result.apiProductSearch.category;
            result.categoryTemplate = categoryTemplate;
        }

        if (empty(result.schemaData) && result.categoryTemplate === 'search/searchResults') {
            result.schemaData = schemaHelper.getListingPageSchema(result.productSearch.productIds);
        }

        // If no matches for a keyword search, show a fallback PLP using the new-arrivals keyword.
        if (req.querystring.q && Number(result.productSearch.count) === 0) {
            var fallbackSearch = new ProductSearchModel();
            var sortingOptions = CatalogMgr.getSortingOptions();
            var fallbackParams = { sz: 30 };
            var rootCategory = CatalogMgr.getSiteCatalog().getRoot();
            var fallbackPhrase = 'new-arrivals';

            // Keep user's explicit sorting choice if present.
            if (req.querystring.srule) {
                fallbackParams.srule = req.querystring.srule;
            }

            fallbackSearch.setSearchPhrase(fallbackPhrase);
            fallbackSearch.setRecursiveCategorySearch(true);
            fallbackSearch.search();

            // Randomize the visible window so fallback items feel mixed.
            var fallbackCount = Number(fallbackSearch.count) || 0;
            if (fallbackCount > 30) {
                var maxStart = fallbackCount - 30;
                var pageBlockCount = Math.floor(maxStart / 30) + 1;
                fallbackParams.start = Math.floor(Math.random() * pageBlockCount) * 30;
            }

            result.productSearch = new ProductSearch(
                fallbackSearch,
                fallbackParams,
                fallbackParams.srule,
                sortingOptions,
                rootCategory
            );
            // Keep UI text tied to what shopper typed, not the internal fallback phrase.
            result.productSearch.searchKeywords = req.querystring.q;
            result.productSearch.noResultsFallback = true;
            result.productSearch.originalSearchQuery = req.querystring.q;
            result.apiProductSearch = fallbackSearch;
            result.refineurl = URLUtils.url('Search-Refinebar', 'q', fallbackPhrase, 'sz', 30);
            result.noResultsQuery = req.querystring.q;
            result.noResultsFallback = true;
        }
    }

    return result;
}

/**
 * Updates search to not include hidden pages
 *
 * @param {Object} contentSearch
 * @returns
 */
function removeHiddenContent (contentSearch) {
    var contents = contentSearch.contents;

    var PageMgr = require('dw/experience/PageMgr');
    var updatedContents = [];

    for (var i = 0; i < contents.length; i++ ){
        var page = PageMgr.getPage(contents[i].id);
        if (page.isVisible()) {
            updatedContents.push(contents[i]);
        }
    }

    contentSearch.contents = updatedContents;
    contentSearch.contentCount = updatedContents.length;

    return contentSearch;
}

 /**
 * check to see if we are coming back from a pdp, if yes, use the old qs to target the traversed productTile
 *
 * @param {Object} clickStream - object with an array of request to the server in the current session
 * @return {string} - pid
 */
function pidFromClickstream (clickStream) {
    var preferences = require('*/cartridge/config/preferences');
    if (!preferences.plpBackButtonOn) {
        return null;
    }

    var URLUtils = require('dw/web/URLUtils');
    var currentClick;
    var limit = preferences.plpBackButtonLimit || 10;
    var clicks = clickStream.clicks.reverse();
    var cgidMatch = /^cgid\=([^&#]*)/gi;
    // does click1 cgid.value === click2 cgid.value
    var isSameCGID = (click1, click2) => click1.pipelineName === 'Search-Show' && click2.pipelineName === 'Search-Show' && (click1.queryString.match(cgidMatch) || [])[1] === (click2.queryString.match(cgidMatch) || [])[1];

    clicks = clicks.filter((click) => ['Search-Show','Product-Show','Product-ShowInCategory'].indexOf(click.pipelineName) !== -1); // remove non-search and pdp clicks
    clicks = clicks.filter((click) => (!(click.queryString || '').includes('ajaxRegion='))); // remove non-search and pdp clicks
    clicks = clicks.filter((click, i, stream) => i == 0 || !isSameCGID(click, stream[i - 1])); // remove same category redirects
    clicks = clicks.filter((click, i, stream) => i == 0 || click.url !== stream[i - 1].url).slice(0, limit); // remove redundant clicks and trim
    var productClick = null;
    var counter = 0;
    var done = false;

    // find the last pdp click and the last search click
    var backClicks = clicks.filter(function (click) {
        if (counter === 0) {
            currentClick = click;
            counter++;
            return true;
        }
        // Includes Product-Show & Product-ShowInCategory
        if (click.pipelineName.indexOf('Product-Show') !== -1 && productClick == null && !done) {
            productClick = click;
            counter++;
            return true;
        }

        if ((click.pipelineName.indexOf('Search-Show') !== -1) ||
            (click.pipelineName.indexOf('Search-UpdateGrid') !== -1)) {
            done = true;
        }
        counter++;
        return false;
    });

    if (backClicks.length == 2) {
        // Add pid of item just clicked on to scroll to it on page load
        if (productClick) {
            const previous = productClick.queryString.split('&');
            var pid = previous.find((el) => el.includes('pid='));
            pid = pid.replace('pid=', '');

            return pid;
        }
    }
}

 /**
 * check to see if we are coming back from a pdp, if yes, use the old qs to set up the grid refinements and number of tiles
 *
 * @param {Object} clickStream - object with an array of request to the server in the current session
 * @return {string} - url to redirect to
 */
 function backButtonDetection(clickStream) {
    var preferences = require('*/cartridge/config/preferences');
    if (!preferences.plpBackButtonOn) {
        return null;
    }

    var URLUtils = require('dw/web/URLUtils');
    var currentClick;
    var limit = preferences.plpBackButtonLimit || 10;
    var clicks = clickStream.clicks.reverse();
    clicks = clicks.filter((click) => ['Search-Show','Search-ShowAjax','Search-UpdateGrid','Product-Show','Product-ShowInCategory'].indexOf(click.pipelineName) !== -1); // remove non-search and pdp clicks
    clicks = clicks.filter((click) => (!(click.queryString || '').includes('ajaxRegion='))); // remove non-search and pdp clicks
    clicks = clicks.filter((click, i, stream) => i == 0 || click.url !== stream[i - 1].url).slice(0, limit); // remove redundant clicks and trim
    var productClick = null;
    var searchClick = null;
    var counter = 0;
    var done = false;

    // find the last pdp click and the last search click
    var backClicks = clicks.filter(function (click) {
        if (counter === 0) {
            currentClick = click;
            counter++;
            return true;
        }
        // Includes Product-Show & Product-ShowInCategory
        if (click.pipelineName.indexOf('Product-Show') > -1 && productClick == null && !done) {
            productClick = click;
            counter++;
            return true;
        }

        if ((click.pipelineName.indexOf('Search-Show') > -1 && searchClick == null)
            || (click.pipelineName.indexOf('Search-UpdateGrid') > -1 && searchClick == null)
            || (click.pipelineName.indexOf('Search-ShowAjax') > -1 && searchClick == null)
        ) {
            searchClick = click;
            counter++;
            done = true;
            return true;
        }
        counter++;
        return false;
    });

    if (backClicks.length === 3) { // three equals CurrentPLP, PDP, PreviousPLP
        var strCurrent = currentClick.queryString;
        var strCurrentArray = strCurrent.split('&');
        var cgidCurrentValue;
        var qCurrentValue;
        // Create comparre to current URL to reduce redirect directives
        var last = clickStream.last && URLUtils.url(clickStream.last.pipelineName);

        strCurrentArray.forEach(function (strElement) {
            var strElementSplit = strElement.split('=');
            if (strElementSplit[0] === 'cgid') { cgidCurrentValue = strElementSplit[1]; }
            if (strElementSplit[0] === 'q') { qCurrentValue = strElementSplit[1]; }

            strElementSplit[1] = decodeURIComponent(strElementSplit[1]);

            // URL.Append will encode '+' as %2B when CommerceCloud/Browsers treat '+' as a space
            if (strElementSplit[0] === 'q') {
                strElementSplit[1] = strElementSplit[1].replace(/\+/gim,' ');
            }
            // Append curent parameters to flesh out URL
            last.append(strElementSplit[0], strElementSplit[1]);
        });

        var str = searchClick.queryString;
        var strArray = str.split('&');
        strArray = strArray.filter(item => !item.includes('selectedUrl')); // Clean poluting param from SFRA
        var paramArray = [];
        var valueArray = [];
        var cgidValue;
        var qValue;
        var szPos;
        var startPos;

        strArray.forEach(function (strElement2, i) {
            var strElementSplit2 = strElement2.split('=');
            if (strElementSplit2[0] === 'cgid') { cgidValue = strElementSplit2[1]; }
            if (strElementSplit2[0] === 'q') { qValue = strElementSplit2[1]; }
            if (strElementSplit2[0] === 'sz') { szPos = i; }
            if (strElementSplit2[0] === 'start') { startPos = i; }
            paramArray.push(strElementSplit2[0]);
            valueArray.push(decodeURIComponent(strElementSplit2[1]));
        });

        // alter the sz and start parameters
        if (!!szPos && !!startPos) {
            valueArray[szPos] = parseInt(valueArray[startPos], 10) + parseInt(valueArray[szPos], 10);
            valueArray[startPos] = 0;
        }

        // check that cgid or q parameter are matching and build url with old parameters
        if ((cgidCurrentValue && cgidCurrentValue === cgidValue) || (qCurrentValue && qCurrentValue === qValue)) {
            var redirectGridUrl = URLUtils.url('Search-Show');
            paramArray.forEach(function (param, i) {
                // URL.Append will encode '+' as %2B when CommerceCloud/Browsers treat '+' as a space
                if (paramArray[i] === 'q') {
                    valueArray[i] = valueArray[i].replace(/\+/gim,' ');
                }

                // Decode the value prior to appending as apped will re-encode
                redirectGridUrl.append(paramArray[i], valueArray[i]);
            });

            // Do not redirect to current URL (introduces extra browser request)
            if (last.toString() !== redirectGridUrl.toString()) {
                // Do not convert to string
                return redirectGridUrl;
            }
        }
    }
    return null;
}

base.getPageDesignerCategoryPage = getPageDesignerCategoryPage;
base.backButtonDetection = backButtonDetection;
base.pidFromClickstream = pidFromClickstream;
base.setupContentSearch = setupContentSearch;
base.removeHiddenContent = removeHiddenContent;
base.paginateContentResults = paginateContentResults;
base.sortContentResults = sortContentResults;
base.search = search;

module.exports = base;
