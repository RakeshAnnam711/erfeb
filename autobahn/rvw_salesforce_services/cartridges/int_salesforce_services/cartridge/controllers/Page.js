'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Page-LiveChatInclude: Render helper for velocity template use, called from the postFooter hook implementation.
*/
server.get('LiveChatInclude', server.middleware.include, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var current = Site.getCurrent();
    var viewData = res.getViewData();

    res.render('liveChat/liveChatScript', {
        ChatBaseUrl: current.getCustomPreferenceValue('ChatBaseUrl'),
        ServerInstanceUrl: current.getCustomPreferenceValue('ServerInstanceUrl'),
        ChatOrganizationId: current.getCustomPreferenceValue('ChatOrganizationId'),
        AgentContentUrl: current.getCustomPreferenceValue('AgentContentUrl'),
        DeploymentId: current.getCustomPreferenceValue('DeploymentId'),
        ButtonId: current.getCustomPreferenceValue('ButtonId'),
        BaseLiveAgentUrl: current.getCustomPreferenceValue('BaseLiveAgentUrl'),
        ESWLiveAgentDevName: current.getCustomPreferenceValue('ESWLiveAgentDevName'),
        ButtonSourceAttribute: current.getCustomPreferenceValue('ButtonSourceAttribute'),
        OfflineSupportEnabled: current.getCustomPreferenceValue('OfflineSupportEnabled'),
        InitEswUrl: current.getCustomPreferenceValue('InitEswUrl'),
        liveChatSiteId: !empty(viewData.siteContext) ? viewData.siteContext.liveChatID : 'autobahnservicecloud',
        LiveAgentName: current.getCustomPreferenceValue('LiveAgentName'),
        ServiceJSURL: current.getCustomPreferenceValue('ServiceJSURL')
    });

    next();
});

module.exports = server.exports();
