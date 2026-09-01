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
            var configuration = svc.getConfiguration();
            var credential = configuration.getCredential();
            var url = (credential.getURL() || 'https://wgaca.search.frenzy.ai') + '/popular-searches';
            var apiToken = credential.getPassword() || "b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5";
            svc.setRequestMethod("GET");
            svc.addHeader("Content-Type", "application/json");

            if (!empty(apiToken)) {
                svc.addHeader(
                    "x-frenzy-authorization",
                    apiToken // Add authorization headers if needed
                );
            }
            svc.setURL(url);
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
function PopularSearchesSuggestions(maxItems) {
    var phrases = [];
    var result = callExternalAPI();

    if (result && result.ok) {
        var popularSearches = result.object.popular_searches; // Adjust based on actual API response

        if (Array.isArray(popularSearches)) {
            // Check if popularSearches is an array
            for (var i = 0; i < popularSearches.length && i < maxItems; i++) {
                var phrase = popularSearches[i]; // Loop through array directly
                phrases.push({
                    value: phrase,
                    url: URLUtils.url(ACTION_ENDPOINT, "q", phrase),
                });
            }
        } else {
            dw.system.Logger.error(
                "Expected an array for popular_searches, but got: " +
                    typeof popularSearches
            );
        }
    } else {
        dw.system.Logger.error(
            "Failed to retrieve popular searches: " +
                (result ? result.error : "No result")
        );
    }
    this.phrases = phrases;
}

module.exports = PopularSearchesSuggestions;
