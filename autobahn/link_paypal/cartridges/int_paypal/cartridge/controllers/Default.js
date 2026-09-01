'use strict';

/**
 * @namespace Default
 */

const server = require('server');

server.extend(module.superModule);

server.append('Start', function(req, res, next) {
    res.setViewData({
        action: 'Home-Show'
    });

    next();
});

module.exports = server.exports();
