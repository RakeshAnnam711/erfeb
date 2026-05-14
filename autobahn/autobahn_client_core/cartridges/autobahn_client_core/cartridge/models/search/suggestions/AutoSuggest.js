"use strict";

var URLUtils = require("dw/web/URLUtils");
var LocalServiceRegistry = require("dw/svc/LocalServiceRegistry"); // Import LocalServiceRegistry
var ACTION_ENDPOINT = "Search-Show";

/**
 * Function to make an external API call
 * @returns {Object} result - API response
 */
function callExternalAPI(query) {
    var service = LocalServiceRegistry.createService("FrenzyAIService", {
        createRequest: function (svc) {
            var configuration = svc.getConfiguration();
            var credential = configuration.getCredential();
            var encodedQuery = encodeURIComponent(query);
            var url = 'https://wgaca.search.frenzy.ai/suggest?query=' + encodedQuery;
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
 * @classdesc AutoSuggest API class
 *
 */
function AutoSuggest(query, maxItems, minChars) {
    var phrases = [];

    if (query.length >= minChars) {
        var result = callExternalAPI(query);
        if (result && result.ok) {
            var autoPhrases = result.object.suggestions; // Adjust based on actual API response
    
            if (Array.isArray(autoPhrases)) {
                // Check if autoPhrases is an array
                for (var i = 0; i < autoPhrases.length && i < maxItems; i++) {
                    var phrase = autoPhrases[i]; // Loop through array directly
                    phrases.push(phrase);
                }
            } else {
                dw.system.Logger.error(
                    "Expected an array for auto_suggest, but got: " +
                        typeof autoPhrases
                );
            }
        } else {
            dw.system.Logger.error(
                "Failed to retrieve auto suggest: " +
                    (result ? result.error : "No result")
            );
        }
    }
    this.phrases = phrases;
}

module.exports = AutoSuggest;
