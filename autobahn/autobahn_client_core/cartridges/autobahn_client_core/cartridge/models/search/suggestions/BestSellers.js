"use strict";

var URLUtils = require("dw/web/URLUtils");
var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry"); // Import LocalServiceRegistry
var ACTION_ENDPOINT = "Search-Show";

/**
 * Function to make an external API call
 * @returns {Object} result - API response
 */
function callExternalAPI() {
    var service = LocalServiceRegistry.createService("FrenzyAIService", {
        createRequest: function (svc) {
            svc.setRequestMethod("GET");
            svc.addHeader("Content-Type", "application/json");
            svc.addHeader(
                "x-frenzy-authorization",
                "b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5" // Add authorization headers if needed
            );
            var endpoint = "https://wgaca.search.frenzy.ai/most-clicked-skus?full_description=true"; // Customize your endpoint
            svc.setURL(endpoint);
        },
        parseResponse: function (svc, client) {            
            return JSON.parse(client.text);
        },
        filterLogMessage: function (msg) {
            return msg;
        },
    });

    try {
        var result = service.call();
        return result;
    } catch (e) {
        // Log the error for debugging purposes
        dw.system.Logger.error("Error calling external API: " + e.message);
        return null;
    }
}

/**
 * @constructor
 * @classdesc PopularSearchesSuggestions class
 *
 */
function BestSellers(maxItems) {
    var matching_products = [];
    var result = callExternalAPI();

    if (result && result.ok) {
        var bestSellers = result.object.data.matching_products; // Adjust based on actual API response

        if (Array.isArray(bestSellers)) {
            // Check if popularSearches is an array
            for (var i = 0; i < bestSellers.length && i < maxItems; i++) {
                var phrase = bestSellers[i]; // Loop through array directly
                matching_products.push({
                    value: phrase,
                    url: URLUtils.url(ACTION_ENDPOINT, "q", phrase),
                });
            }
        } else {
            dw.system.Logger.error(
                "Expected an array for best_sellers, but got: " +
                    typeof bestSellers
            );
        }
    } else {
        dw.system.Logger.error(
            "Failed to retrieve popular searches: " +
                (result ? result.error : "No result")
        );
    }   
    this.matching_products = matching_products;
}

module.exports = BestSellers;
