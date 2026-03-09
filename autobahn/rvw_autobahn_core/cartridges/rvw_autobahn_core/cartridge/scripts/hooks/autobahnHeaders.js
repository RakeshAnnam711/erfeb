"use strict";

exports.registerRoute = function (route) {
    var Resource = require('dw/web/Resource');

    route.on('route:BeforeComplete', function onRouteCompleteHandler(req, res) {
        // Set Autobahn Version Header
        res.setHttpHeader('X-SF-CC-AUTOBAHN-PACKAGE', [Resource.msg('json.name','packagejson','autobahn'), Resource.msg('json.version','packagejson','unknownversion'),  Resource.msg('releasetag','packagejson','sandbox')].join('_'));
        res.setHttpHeader('Referrer-Policy', "strict-origin-when-cross-origin");
        res.setHttpHeader('X-FRAME-OPTIONS', 'SAMEORIGIN');
        res.setHttpHeader("Content-Security-Policy", "frame-ancestors 'self'");
    });
};
