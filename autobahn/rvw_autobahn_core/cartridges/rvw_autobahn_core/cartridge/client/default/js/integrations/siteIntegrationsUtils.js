'use strict';

/**
 * This client-side js file just acts as a wrapper for the site preference config toggles
 * that are outputted by Controller: Integrations-OutputIntegrationsConfig
 */

function getIntegrationSettings() {
    if (window && window.CachedData && window.CachedData.siteIntegrations) {
        // WGACA MODIFICATION for checkout failures with unused BOPIS
        return window?.CachedData?.siteIntegrations;
    }
    return {};
}

module.exports = {
    getIntegrationSettings : getIntegrationSettings
};
