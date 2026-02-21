'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');

var server = require('server');
server.extend(module.superModule);

// Apply dynamic cache rules
server.append('Show', cache.applyDynamicPromotionSensitiveCache);

module.exports = server.exports();
