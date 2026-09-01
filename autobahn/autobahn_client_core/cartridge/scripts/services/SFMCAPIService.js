'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

function getEventDefinitionKey() {
    return Site.getCurrent().getCustomPreferenceValue('marketingEventDefinitionKey');
}

function getOrderEventDefinitionKey() {
    return Site.getCurrent().getCustomPreferenceValue('marketingOrderEventDefinitionKey');
}

function getBrandList() {
    var brandList = Site.getCurrent().getCustomPreferenceValue('marketingOrderEventBrandList');
    var brandArray = brandList ? brandList.split(',') : []; // Split the string into an array

    // Trim whitespace from each element (optional)
    brandArray = brandArray.map(function (brand) {
        return brand.trim().toLowerCase();
    });
    dw.system.Logger.info('Brand List: ' + JSON.stringify(brandArray)); // Log output

    return brandArray;

}

/**
 * Helper function to fetch access token
 * @returns {string|null} Access token if successful, otherwise null
 */
function fetchAccessToken() {
    try {
        const clientId = Site.getCurrent().getCustomPreferenceValue('marketingCloudWJClientId'); // Fetch clientId from custom preference
        const clientSecret = Site.getCurrent().getCustomPreferenceValue('marketingCloudWJClientSecret'); // Fetch clientSecret from custom preference
        const url = Site.getCurrent().getCustomPreferenceValue('marketingCloudAuthUrl'); // Fetch auth URL from custom preference

        // Create an HTTP client
        const httpClient = new dw.net.HTTPClient();

        // Prepare the payload
        const payload = JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        });

        // Set headers
        httpClient.setTimeout(3000); // 3 seconds timeout
        httpClient.open('POST', url);
        httpClient.setRequestHeader('Content-Type', 'application/json');

        // Send the request
        httpClient.send(payload);

        // Handle the response
        if (httpClient.statusCode === 200) {
            const response = JSON.parse(httpClient.text);
            if (response && response.access_token) {
                Logger.info('Access token fetched successfully.');
                return response.access_token;
            }
            Logger.error('Access token not found in the response.');
        } else {
            Logger.error(`Failed to fetch access token. Status: ${httpClient.statusCode}, Response: ${httpClient.text}`);
        }
    } catch (error) {
        Logger.error(`Error fetching access token: ${error.message}`);
    }

    return null;
}

/**
 * Helper function to call the interaction API using the access token
 * @param {string} accessToken - The access token to use for the API call
 * @param {Object} eventData - The event data to send in the request body
 * @returns {Object|null} Response from the API if successful, otherwise null
 */
function triggerInteractionEvent(accessToken, eventData) {
    try {
        const url = Site.getCurrent().getCustomPreferenceValue('marketingCloudInteractionUrl'); // Fetch interaction URL from custom preference

        const httpClient = new dw.net.HTTPClient();

        const payload = JSON.stringify(eventData);

        httpClient.setTimeout(3000);
        httpClient.open('POST', url);
        httpClient.setRequestHeader('Content-Type', 'application/json');
        httpClient.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        httpClient.send(payload);

        if (httpClient.statusCode == 200 || httpClient.statusCode == 201) {
            const response = JSON.parse(httpClient.text);
            Logger.info(`Interaction event triggered successfully.Response: ${httpClient.text}`);
            return response;
        } else {
            Logger.error(`Failed to trigger interaction event. Status: ${httpClient.statusCode}, Response: ${httpClient.text}`);
        }
    } catch (error) {
        Logger.error(`Error triggering interaction event: ${error.message}`);
    }

    return null;
}

module.exports = {
    getBrandList: getBrandList,
    getEventDefinitionKey: getEventDefinitionKey,
    getOrderEventDefinitionKey: getOrderEventDefinitionKey,
    fetchAccessToken: fetchAccessToken,
    triggerInteractionEvent: triggerInteractionEvent
};