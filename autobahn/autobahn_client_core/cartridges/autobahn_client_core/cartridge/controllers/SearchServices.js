'use strict';

/**
 * @namespace SearchServices
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var Cookie = require('dw/web/Cookie');
var URLUtils = require('dw/web/URLUtils');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var cache = require('*/cartridge/scripts/middleware/cache');
var productPreferences = require('*/cartridge/config/preferences');
var images = require('*/cartridge/models/product/decorators/images');

var PRODUCT_TILE_ENDPOINT = productPreferences.suggestionsActionEnpoint || 'Product-Show';
var PRODUCT_IMAGE_SIZE = productPreferences.imageSize || 'medium';
var LAST_SEARCH_COOKIE = 'autobahn_last_search_term';
var LAST_SEARCH_COOKIE_AGE = 60 * 60 * 24 * 30;

function getImageUrl(product) {
    var imageProduct = product.master ? product.variationModel.defaultVariant : product;
    var imageObject = {};

    images(imageObject, imageProduct, { types: [PRODUCT_IMAGE_SIZE], quantity: 'single' });

    if (imageObject.images
        && imageObject.images[PRODUCT_IMAGE_SIZE]
        && imageObject.images[PRODUCT_IMAGE_SIZE][0]
        && imageObject.images[PRODUCT_IMAGE_SIZE][0].url) {
        return imageObject.images[PRODUCT_IMAGE_SIZE][0].url;
    }

    return '';
}

function getBrandName(product) {
    if (product.brand) {
        return product.brand;
    }

    if (product.manufacturerName) {
        return product.manufacturerName;
    }

    if (product.custom && product.custom.brand) {
        return product.custom.brand;
    }

    return '';
}

function getPrimaryCategory(product) {
    return product.primaryCategory || null;
}

function buildEmptySearchFallback(maxProductItems, maxCategoryItems, maxBrandItems) {
    var popularProducts = [];
    var popularCategories = [];
    var popularBrands = [];
    var productSearch = new ProductSearchModel();
    var rootCategory = CatalogMgr.siteCatalog && CatalogMgr.siteCatalog.root;
    var hits;
    var seenCategoryIds = {};
    var seenBrands = {};
    var total;

    if (rootCategory) {
        productSearch.setCategoryID(rootCategory.ID);
        productSearch.setRecursiveCategorySearch(true);

        if (rootCategory.defaultSortingRule) {
            productSearch.setSortingRule(rootCategory.defaultSortingRule);
        }
    }

    productSearch.setOrderableProductsOnly(true);
    productSearch.search();
    hits = productSearch.productSearchHits;

    while (hits && hits.hasNext()) {
        var hit = hits.next();
        var product = hit.product;
        var category;
        var brandName;

        if (!product) {
            continue;
        }

        if (popularProducts.length < maxProductItems) {
            popularProducts.push({
                name: product.name,
                imageUrl: getImageUrl(product),
                url: URLUtils.url(PRODUCT_TILE_ENDPOINT, 'pid', product.ID)
            });
        }

        category = getPrimaryCategory(product);
        if (category && !seenCategoryIds[category.ID] && popularCategories.length < maxCategoryItems) {
            seenCategoryIds[category.ID] = true;
            popularCategories.push({
                name: category.displayName,
                url: URLUtils.url('Search-Show', 'cgid', category.ID)
            });
        }

        brandName = getBrandName(product);
        if (brandName && !seenBrands[brandName] && popularBrands.length < maxBrandItems) {
            seenBrands[brandName] = true;
            popularBrands.push({
                value: brandName,
                url: URLUtils.url('Search-Show', 'q', brandName)
            });
        }

        if (popularProducts.length >= maxProductItems
            && popularCategories.length >= maxCategoryItems
            && popularBrands.length >= maxBrandItems) {
            break;
        }
    }

    total = popularProducts.length + popularCategories.length + popularBrands.length;

    return {
        product: {
            available: popularProducts.length > 0,
            products: popularProducts,
            phrases: []
        },
        category: {
            available: popularCategories.length > 0,
            categories: popularCategories
        },
        content: { available: false, contents: [] },
        recent: { available: false, phrases: [] },
        popular: { available: false, phrases: [] },
        phrase_suggestions: { phrases: [] },
        bestsellers: { matching_products: [] },
        brand: {
            available: popularBrands.length > 0,
            phrases: popularBrands
        },
        query: '',
        message: Resource.msgf('label.header.search.result.count.msg', 'common', null, ['' + total])
    };
}

function buildEmptySearchSuggestions(maxProductItems, maxCategoryItems, maxBrandItems) {
    var lastSearchTerm = getLastSearchTerm();

    if (lastSearchTerm) {
        var storedSearchSuggestions = buildTypedSearchSuggestions(
            lastSearchTerm,
            null,
            maxBrandItems,
            maxProductItems,
            maxCategoryItems
        );

        if (storedSearchSuggestions.hasVisibleSuggestions) {
            storedSearchSuggestions.payload.query = '';
            storedSearchSuggestions.payload.phrase_suggestions = { phrases: [] };
            storedSearchSuggestions.payload.recent = { available: false, phrases: [] };
            storedSearchSuggestions.payload.popular = { available: false, phrases: [] };
            return storedSearchSuggestions.payload;
        }
    }

    return buildEmptySearchFallback(maxProductItems, maxCategoryItems, maxBrandItems);
}

function getLastSearchTerm() {
    var httpCookies = request.httpCookies;
    var lastSearchCookie = httpCookies && httpCookies[LAST_SEARCH_COOKIE];

    if (lastSearchCookie && lastSearchCookie.value) {
        return lastSearchCookie.value;
    }

    return '';
}

function setLastSearchTerm(searchTerms) {
    var lastSearchCookie;

    if (!searchTerms) {
        return;
    }

    lastSearchCookie = new Cookie(LAST_SEARCH_COOKIE, searchTerms);
    lastSearchCookie.setPath('/');
    lastSearchCookie.setMaxAge(LAST_SEARCH_COOKIE_AGE);
    response.addHttpCookie(lastSearchCookie);
}

function buildTypedSearchSuggestions(searchTerms, stripeMidValue, maxSuggestions, maxProductSuggestions, maxCategorySuggestions) {
    var SuggestModel = require('dw/suggest/SuggestModel');
    var suggestions = new SuggestModel();

    suggestions.setFilteredByFolder(false);
    suggestions.setSearchPhrase(searchTerms);
    suggestions.setMaxSuggestions(Math.max(maxSuggestions, maxProductSuggestions));

    return buildPhraseSuggestionsPayload(
        suggestions,
        searchTerms,
        stripeMidValue,
        maxSuggestions,
        maxProductSuggestions,
        maxCategorySuggestions
    );
}

function buildPhraseSuggestionsPayload(suggestions, searchTerms, stripeMidValue, maxSuggestions, maxProductSuggestions, maxCategorySuggestions) {
    var CategorySuggestions = require('*/cartridge/models/search/suggestions/category');
    var ContentSuggestions = require('*/cartridge/models/search/suggestions/content');
    var ProductSuggestions = require('*/cartridge/models/search/suggestions/product');
    var SearchPhraseSuggestions = require('*/cartridge/models/search/suggestions/searchPhrase');
    var categorySuggestions = new CategorySuggestions(suggestions, maxCategorySuggestions);
    var contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
    var productSuggestions = new ProductSuggestions(suggestions, maxProductSuggestions, searchTerms, stripeMidValue);
    var recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
    var popularSuggestions = new SearchPhraseSuggestions(suggestions.popularSearchPhrases, maxSuggestions);
    var brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);
    var autoSuggest = {
        phrases: (productSuggestions && productSuggestions.phrases) ? productSuggestions.phrases : []
    };
    var bestSellers = {
        matching_products: []
    };

    return {
        hasSuggestions: productSuggestions.available || contentSuggestions.available
            || categorySuggestions.available
            || recentSuggestions.available
            || popularSuggestions.available
            || (autoSuggest.phrases && autoSuggest.phrases.length)
            || brandSuggestions.available,
        hasVisibleSuggestions: productSuggestions.available || categorySuggestions.available || brandSuggestions.available,
        payload: {
            product: productSuggestions,
            category: categorySuggestions,
            content: contentSuggestions,
            recent: recentSuggestions,
            popular: popularSuggestions,
            phrase_suggestions: autoSuggest,
            bestsellers: bestSellers,
            brand: brandSuggestions,
            query: searchTerms,
            message: Resource.msgf(
                'label.header.search.result.count.msg',
                'common',
                null,
                ['' + (
                    productSuggestions.products.length
                    + contentSuggestions.contents.length
                    + categorySuggestions.categories.length
                    + recentSuggestions.phrases.length
                    + popularSuggestions.phrases.length
                    + autoSuggest.phrases.length
                    + brandSuggestions.phrases.length
                )]
            )
        }
    };
}

/**
 * SearchServices-GetSuggestions : The SearchServices-GetSuggestions endpoint is responsible for searching as you type and displaying the suggestions from that search
 * @name Base/SearchServices-GetSuggestions
 * @function
 * @memberof SearchServices
 * @param {middleware} - cache.applyDefaultCache
 * @param {querystringparameter} - q - the query string a shopper is searching for
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace('GetSuggestions', cache.applyDefaultCache, function (req, res, next) {
    var searchTerms = req.querystring.q;
    var stripeMidValue = req.querystring.stripeMidValue;
    var maxSuggestions = 3;
    var maxProductSuggestions = 6;
    var maxCategorySuggestions = 3;
    var maxBrandSuggestions = 3;

    if (!searchTerms) {
        res.render('search/suggestions', {
            suggestions: buildEmptySearchSuggestions(
                maxProductSuggestions,
                maxCategorySuggestions,
                maxBrandSuggestions
            )
        });
        next();
        return;
    }

    setLastSearchTerm(searchTerms);

    var typedSearchSuggestions = buildTypedSearchSuggestions(
        searchTerms,
        stripeMidValue,
        maxSuggestions,
        maxProductSuggestions,
        maxCategorySuggestions
    );

    if (typedSearchSuggestions.hasSuggestions) {
        res.render('search/suggestions', {
            suggestions: typedSearchSuggestions.payload
        });
    } else {
        res.json({});
    }

    next();
});

module.exports = server.exports();
