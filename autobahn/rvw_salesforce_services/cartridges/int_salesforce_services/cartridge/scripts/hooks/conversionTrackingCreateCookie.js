'use strict';

module.exports = {
    registerRoute: function (route) {
        route.on('route:Start', function (req, res) {
            var Site = require('dw/system/Site');
            var cookies = request.getHttpCookies();
            var UTMSource = Site.getCurrent().getCustomPreferenceValue('ConversionTrackingUTMSource');
            if (req.querystring.utm_source === UTMSource) {
                var Cookie = require('dw/web/Cookie');
                var URLUtils = require('dw/web/URLUtils');
                var qs = req.querystring;
                var action = res.viewData.action;
                var cookieAge = Site.getCurrent().getCustomPreferenceValue('ConversionTrackingCookieAge').value;

                // Object to represent the params in the cookie
                var conversionTrackingObj = {
                    j: qs.j,
                    l: qs.l,
                    u: qs.u,
                    mid: qs.mid,
                    jb: qs.jb,
                    utm_source: qs.utm_source,
                    utm_medium: qs.utm_medium,
                    utm_campaign: qs.utm_campaign,
                    utm_term: qs.utm_term,
                    utm_id: qs.utm_id,
                    sfmc_sub: qs.sfmc_sub,
                    sfmc_id:qs.sfmc_id
                };

                var conversionTrackingCookie = new Cookie("conversionTracking", JSON.stringify(conversionTrackingObj));
                conversionTrackingCookie.setMaxAge(cookieAge);
                conversionTrackingCookie.setDomain(Site.getCurrent().getHttpHostName());
                conversionTrackingCookie.setHttpOnly(true);
                conversionTrackingCookie.setSecure(true);
                conversionTrackingCookie.setPath('/');

                response.addHttpCookie(conversionTrackingCookie);
                cookies = request.getHttpCookies();
            }
        });
    }
};