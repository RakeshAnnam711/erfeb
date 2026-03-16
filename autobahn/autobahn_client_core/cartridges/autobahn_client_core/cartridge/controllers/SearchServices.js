'use strict';

/**
 * @namespace SearchServices
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

var cache = require('*/cartridge/scripts/middleware/cache');
var preferences = require('*/cartridge/config/preferences.js');

function getPreferenceList(preferenceId) {
    var preferenceValue = Site.getCurrent().getCustomPreferenceValue(preferenceId);

    if (empty(preferenceValue)) {
        return [];
    }

    return String(preferenceValue)
        .split(',')
        .map(function (value) {
            return value && value.trim();
        })
        .filter(function (value) {
            return !empty(value);
        });
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
    var SuggestModel = require('dw/suggest/SuggestModel');
    var CategorySuggestions = require('*/cartridge/models/search/suggestions/category');
    var ContentSuggestions = require('*/cartridge/models/search/suggestions/content');
    var ProductSuggestions = require('*/cartridge/models/search/suggestions/product');
    var SearchPhraseSuggestions = require('*/cartridge/models/search/suggestions/searchPhrase');
    var categorySuggestions;
    var contentSuggestions;
    var productSuggestions;
    var recentSuggestions;
    var popularSuggestions;
    var autoSuggest;
    var brandSuggestions;
    var searchTerms = req.querystring.q;
    var stripeMidValue = req.querystring.stripeMidValue;
    var suggestions;
    var minChars = preferences.minTermLength;
    var maxSuggestions = preferences.maxSuggestions;
    var maxProductSuggestions = 6;
    var maxCategorySuggestions = 6;
    var popularBrands = getPreferenceList('headerSearchPopularBrands');
    var popularCategories = getPreferenceList('headerSearchPopularCategories');

    if (!searchTerms || searchTerms.length < minChars) {
        var staticBrandSuggestions = popularBrands.map(function (brandName) {
            return {
                value: brandName,
                url: URLUtils.url('Search-Show', 'q', brandName)
            };
        });
        var staticCategorySuggestions = popularCategories.map(function (categoryName) {
            return {
                name: categoryName,
                url: URLUtils.url('Search-Show', 'q', categoryName)
            };
        });
        var staticSuggestionCount = staticBrandSuggestions.length + staticCategorySuggestions.length;

        res.render('search/suggestions', {
            suggestions: {
                product: { available: false, products: [], phrases: [] },
                category: { available: staticCategorySuggestions.length > 0, categories: staticCategorySuggestions },
                content: { available: false, contents: [] },
                recent: { available: false, phrases: [] },
                popular: { available: false, phrases: [] },
                phrase_suggestions: { phrases: [] },
                bestsellers: { matching_products: [] },
                brand: { available: staticBrandSuggestions.length > 0, phrases: staticBrandSuggestions },
                query: '',
                message: Resource.msgf('label.header.search.result.count.msg', 'common', null, ['' + staticSuggestionCount])
            }
        });
        next();
        return;
    }

    suggestions = new SuggestModel();
    suggestions.setFilteredByFolder(false);
    suggestions.setSearchPhrase(searchTerms);
    // Allow more product suggestions while keeping other sections configurable.
    suggestions.setMaxSuggestions(Math.max(maxSuggestions, maxProductSuggestions));
    categorySuggestions = new CategorySuggestions(suggestions, maxCategorySuggestions);
    contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
    productSuggestions = new ProductSuggestions(suggestions, maxProductSuggestions, searchTerms, stripeMidValue);
    recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
    popularSuggestions = new SearchPhraseSuggestions(suggestions.popularSearchPhrases, maxSuggestions);
    brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

    autoSuggest = {
        phrases: (productSuggestions && productSuggestions.phrases) ? productSuggestions.phrases : []
    };
    var bestSellers = {
        matching_products: []
    };

    if (productSuggestions.available || contentSuggestions.available
        || categorySuggestions.available
        || recentSuggestions.available
        || popularSuggestions.available
        || (autoSuggest.phrases && autoSuggest.phrases.length)
        || brandSuggestions.available) {
        var total = productSuggestions.products.length + contentSuggestions.contents.length
            + categorySuggestions.categories.length
            + recentSuggestions.phrases.length
            + popularSuggestions.phrases.length
            + autoSuggest.phrases.length
            + brandSuggestions.phrases.length;
        res.render('search/suggestions', {
            suggestions: {
                product: productSuggestions,
                category: categorySuggestions,
                content: contentSuggestions,
                recent: recentSuggestions,
                popular: popularSuggestions,
                phrase_suggestions: autoSuggest,
                bestsellers: bestSellers,
                brand: brandSuggestions,
                query: searchTerms,
                message: Resource.msgf('label.header.search.result.count.msg', 'common', null, ['' + total])
            }
        });
    } else {
        res.json({});
    }

    next();
});

module.exports = server.exports();
