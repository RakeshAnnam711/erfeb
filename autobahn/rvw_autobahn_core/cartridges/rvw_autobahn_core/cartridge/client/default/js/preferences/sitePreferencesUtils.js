'use strict';

/**
 * This client-side js file just acts as a wrapper for the site preferences
 * that are outputted by AB Controller: Data-CachedData
 */

function getSitePreferences() {
    if (window && window.CachedData && window.CachedData.sitePreferences) {
        return window.CachedData.sitePreferences;
    }
    return {};
}

module.exports = {
    getSitePreferences : getSitePreferences
};
