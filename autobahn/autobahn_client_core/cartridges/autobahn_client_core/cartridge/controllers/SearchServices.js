'use strict';

/**
 * @namespace SearchServices
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');

var cache = require('*/cartridge/scripts/middleware/cache');
var preferences = require('*/cartridge/config/preferences.js');

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
    var PopularSearchesSuggestions = require('*/cartridge/models/search/suggestions/PopularSearches');
    var AutoSuggest = require('*/cartridge/models/search/suggestions/AutoSuggest');
    var BestSellers = require('*/cartridge/models/search/suggestions/BestSellers');
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
    // TODO: Move minChars and maxSuggestions to Site Preferences when ready for refactoring
    var minChars = preferences.minTermLength;
    // Unfortunately, by default, max suggestions is set to 10 and is not configurable in Business
    // Manager.
    var maxSuggestions = 3;
    var bestSellersMaxSuggestions = 4;
    var bestSellers;

    if (searchTerms && searchTerms.length >= minChars) {
        suggestions = new SuggestModel();
        suggestions.setFilteredByFolder(false);
        suggestions.setSearchPhrase(searchTerms);
        suggestions.setMaxSuggestions(maxSuggestions);
        categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions);
        contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
        productSuggestions = new ProductSuggestions(suggestions, maxSuggestions, searchTerms, stripeMidValue);
        recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
        popularSuggestions = new PopularSearchesSuggestions(maxSuggestions);
        autoSuggest = new AutoSuggest(searchTerms, maxSuggestions, minChars);
        bestSellers = new BestSellers(bestSellersMaxSuggestions);
        brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

        if (productSuggestions.available || contentSuggestions.available
            || categorySuggestions.available
            || recentSuggestions.available
            || popularSuggestions.available
            || autoSuggest.length
            || brandSuggestions.available) {
            var total = productSuggestions.products.length + contentSuggestions.contents.length
                + categorySuggestions.categories.length
                + recentSuggestions.phrases.length
                + popularSuggestions.phrases.length
                + autoSuggest.length
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
            // res.json({});

            // this block handles searchTerms>3 and a garbage value
            suggestions = new SuggestModel();
            suggestions.setFilteredByFolder(false);
            suggestions.setSearchPhrase(searchTerms);
            suggestions.setMaxSuggestions(maxSuggestions);
            categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions);
            contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
            productSuggestions = new ProductSuggestions(suggestions, maxSuggestions, searchTerms, stripeMidValue);
            recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
            popularSuggestions = new PopularSearchesSuggestions(maxSuggestions);
            autoSuggest = new AutoSuggest(searchTerms, maxSuggestions, minChars);
            bestSellers = new BestSellers(bestSellersMaxSuggestions);
            brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

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
        }
    } else {
        // Return an empty object that can be checked on the client.  By default, rendered
        // templates automatically get a diagnostic string injected into it, making it difficult
        // to check for a null or empty response on the client.
        // res.json({});

        //this block handles searchTerms<3 and empty condition
        suggestions = new SuggestModel();
        suggestions.setFilteredByFolder(false);
        suggestions.setSearchPhrase(searchTerms);
        suggestions.setMaxSuggestions(maxSuggestions);
        categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions);
        contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
        productSuggestions = new ProductSuggestions(suggestions, maxSuggestions, searchTerms, stripeMidValue);
        recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
        popularSuggestions = new PopularSearchesSuggestions(maxSuggestions);
        autoSuggest = new AutoSuggest(searchTerms, maxSuggestions, minChars);
        bestSellers = new BestSellers(bestSellersMaxSuggestions);
        brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

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
    }

    next();
});

module.exports = server.exports();
