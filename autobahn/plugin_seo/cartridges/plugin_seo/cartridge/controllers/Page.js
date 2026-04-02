'use strict';

/**
 * Controller that enhance the Page controller with SEO data
 *
 * @module controllers/Page
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.append('Show', seo.addSchemaData);

module.exports = server.exports();
