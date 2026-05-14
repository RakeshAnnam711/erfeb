'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Start', function (req, res, next) {
    // Override 500 status code from SFRA, 500 prevents controller includes from rendering ISML requests correctly (JSON request still use 500 code)
    if (req.httpHeaders.get('x-requested-with') !== 'XMLHttpRequest') {
        res.setStatusCode(404);
    }
    next();
});

// Avoid overloading error code responses
server.append('ErrorCode', function (req, res, next) {
    res.cachePeriod = 1; // eslint-disable-line no-param-reassign
    res.cachePeriodUnit = 'minutes'; // eslint-disable-line no-param-reassign
    next();
});

module.exports = server.exports();
