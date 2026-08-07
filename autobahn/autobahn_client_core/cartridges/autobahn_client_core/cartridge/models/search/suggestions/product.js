"use strict";

var URLUtils = require("dw/web/URLUtils");
var Site = require('dw/system/Site');
var System = require('dw/system/System');
var preferences = require("*/cartridge/config/preferences");
var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry"); // Ensure LocalServiceRegistry is imported
var ACTION_ENDPOINT = preferences.suggestionsActionEnpoint
    ? preferences.suggestionsActionEnpoint
    : "Product-Show";
var IMAGE_SIZE = preferences.imageSize ? preferences.imageSize : "medium";
var images = require("*/cartridge/models/product/decorators/images");
var liveSellingCategoryHelper = require("*/cartridge/scripts/helpers/liveSellingCategoryHelper");

/**
 * Live selling products are only browsable on their own dedicated category page - never via
 * search-as-you-type suggestions. Mirrors the same category-assignment check used to filter
 * them out of regular search/category results (models/search/productSearch.js).
 *
 * @param {dw.catalog.Product} product - Suggested product
 * @return {boolean} - True if the product should be hidden from suggestions
 */
function isHiddenLiveSellingProduct(product) {
    return liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(product);
}

/**
 * Get Image URL
 *
 * @param {dw.catalog.Product} product - Suggested product
 * @return {string} - Image URL
 */
function getImageUrl(product) {
    var imageProduct = product.master ? product.variationModel.defaultVariant : product;
    var imageObject = new Object;
    var image = images(imageObject, imageProduct, { types: [IMAGE_SIZE], quantity: 'single' });
    var imageUrl = imageObject.images[IMAGE_SIZE][0].url;
    if (imageProduct.productSet && imageUrl.includes('noimage')) {
        imageObject = new Object;
        image = images(imageObject, imageProduct.productSetProducts[0], { types: [IMAGE_SIZE], quantity: 'single' });
        imageUrl = imageObject.images[IMAGE_SIZE][0].url;
    }

    return imageUrl;
}

/**
 * Compile a list of relevant suggested products
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedProduct>} suggestedProducts - Iterator to retrieve
 *                                                                             SuggestedProducts
 *  @param {number} maxItems - Maximum number of products to retrieve
 *  @param {string} rawQuery - query string
 *  @param {string} stripeMidValue - stripe id
 * @return {Object[]} - Array of suggested products
 */
function getProducts(suggestedProducts, maxItems, rawQuery, stripeMidValue) {
    var products = [];
    var useFrenzySearch = Site.current.getCustomPreferenceValue('enableFrenzyRecommendationOnSearchBar');
    var localeOverride = (request.locale || 'en-us').toLowerCase().replace('_','-');

    if(useFrenzySearch){
        var result = callExternalAPI(rawQuery, stripeMidValue);

        if (result && result.ok) {
            var apiProducts = result.object.results; // Assuming 'results' contains products from the API response
            for (var i = 0; i < apiProducts.length && i < maxItems; i++) {
                var product = apiProducts[i];
                var prodObj = {
                    name: product.org_product,
                    imageUrl: product.org_image_url,
                    url: System.getInstanceType() !== System.PRODUCTION_SYSTEM ? product.org_prod_url.replace(/.*\/\/.*\.com\//gi,'/') : product.org_prod_url
                };

                prodObj.url = prodObj.url.replace('en-us', localeOverride);

                products.push(prodObj);
            }
        } else {
            // Log error details if API call fails
            dw.system.Logger.error("Failed to fetch products: " + (result ? result.error : "Unknown error"));
        }
    } else {
        // Log error details if API call fails
        // dw.system.Logger.error("Failed to fetch products: " + (result ? result.error : "Unknown error"));
            var product = null;
            while (products.length < maxItems && suggestedProducts.hasNext()) {
                product = suggestedProducts.next().productSearchHit.product;
                if (isHiddenLiveSellingProduct(product)) {
                    continue;
                }
                products.push({
                    name: product.name,
                    imageUrl: getImageUrl(product),
                    url: URLUtils.url(ACTION_ENDPOINT, 'pid', product.ID)
                });
            }
    }

    return products;
}

/**
 * @typedef SuggestedPhrase
 * @type Object
 * @property {boolean} exactMatch - Whether suggested phrase is an exact match
 * @property {string} value - Suggested search phrase
 */

/**
 * Compile a list of relevant suggested phrases
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve
 *                                                                           SuggestedPhrases
 * @param {number} maxItems - Maximum number of phrases to retrieve
 * @return {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases, maxItems) {
    var phrases = [];

    for (var i = 0; i < maxItems; i++) {
        if (suggestedPhrases.hasNext()) {
            var phrase = suggestedPhrases.next();
            phrases.push({
                exactMatch: phrase.exactMatch,
                value: phrase.phrase,
            });
        }
    }

    return phrases;
}

/**
 * @constructor
 * @classdesc ProductSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of items to retrieve
 * @param {string} rawQuery - Query string for search
 * @param {string} stripeMidValue - Stripe ID for the user
 */
function ProductSuggestions(suggestions, maxItems, rawQuery, stripeMidValue) {
    var productSuggestions = suggestions.productSuggestions;

    if (!productSuggestions) {
        this.available = false;
        this.phrases = [];
        this.products = [];
        return;
    }

    var searchPhrasesSuggestions = productSuggestions.searchPhraseSuggestions;

    this.available = productSuggestions.hasSuggestions();
    this.phrases = getPhrases(
        searchPhrasesSuggestions.suggestedPhrases,
        maxItems
    );
    this.products = getProducts(
        productSuggestions.suggestedProducts,
        maxItems,
        rawQuery,
        stripeMidValue
    );
}

/**
 * Function to make an external API call
 *  @param {string} rawQuery - query string
 *  @param {string} stripeMidValue - stripe id
 * @returns {Object} result - API response
 */
function callExternalAPI(rawQuery, stripeMidValue) {
    var service = LocalServiceRegistry.createService(
        "FrenzyAIService",
        {
            createRequest: function (svc) {
                var configuration = svc.getConfiguration();
                var credential = configuration.getCredential();

                svc.setRequestMethod("POST");
                svc.addHeader("Content-Type", "application/json");
                svc.addHeader(
                    "x-frenzy-authorization",
                    "b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5"
                ); // Add authorization headers if needed

                var payload = {
                    raw_query: rawQuery, // example query (can be dynamic)
                    sort: "best match", // Adjust based on requirements
                    user_id: stripeMidValue, // Replace with actual or anonymous user ID
                    page_index: 0, // Pagination support
                    mode: "raw-query",
                };
                var endpoint = (credential.getURL() || 'https://wgaca.search.frenzy.ai'); // Customize your endpoint
                svc.setURL(endpoint);
                return JSON.stringify(payload); // Sending the payload as JSON
            },
            parseResponse: function (svc, client) {
                return JSON.parse(client.text);
            },
            filterLogMessage: function (msg) {
                return msg;
            },
        }
    );

    try {
        var result = service.call();
        return result;
    } catch (e) {
        // Log error details for debugging
        dw.system.Logger.error("Error calling external API: " + e.message);
        return null;
    }
}

module.exports = ProductSuggestions;
