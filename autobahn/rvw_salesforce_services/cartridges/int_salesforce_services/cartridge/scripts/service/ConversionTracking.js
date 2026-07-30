'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

/**
 *
 * @returns {dw.svc.Service}
 */
function conversionTracking() {
    var service = LocalServiceRegistry.createService('MarketingCloud.ConversionTracking', {
        createRequest: function (svc, args) {
            var subdomain = Site.getCurrent().getCustomPreferenceValue('MarketingCloudTenantSpecificEndpointSubdomain');
            var resource = Site.getCurrent().getCustomPreferenceValue('ConversionTrackingEventCodeResource');
            resource = '/' + resource.replace(/^\//,''); // no replace if resource does not start with forward slash
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            var url = svc.URL.replace('[[MC_ENTERPRISE_SUBDOMAIN_SITEPREF]]', subdomain) + resource;
            svc.setURL(url);
            return args ? JSON.stringify(args) : null;
        },
        parseResponse: function (svc, client) {
            var response = JSON.parse(client.text);
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return service;
}

module.exports = {
    conversionTracking: !empty(Site.getCurrent().getCustomPreferenceValue('ConversionTrackingEventCodeResource')) ? conversionTracking : () => {}
};
