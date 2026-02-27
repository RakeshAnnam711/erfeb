'use strict';

/**
 * Controller that enhance the Home controller with SEO data
 *
 * @module controllers/Home
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.append('Show', seo.addSchemaData);

module.exports = server.exports();
