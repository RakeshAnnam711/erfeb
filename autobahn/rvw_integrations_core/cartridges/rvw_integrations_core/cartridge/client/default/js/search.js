var searchAutobahn = require('core/search');

function initSiteIntegrations() {
    // grab the site pref integration object
    var siteIntegrations = require('./integrations/siteIntegrationsUtils');
    var toggleObject = siteIntegrations.getIntegrationSettings();

    if (toggleObject.yotpoCartridgeEnabled) {
        $('body').on('search:showMore--success search:filter--success search:sort--success', () => {
            window.yotpo.refreshWidgets();
        });
    }
}

searchAutobahn.baseFiles.initSiteIntegrations = initSiteIntegrations;

module.exports = searchAutobahn;
