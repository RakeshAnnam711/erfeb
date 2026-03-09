'use strict';

/**
 * Controller that enhance the Product controller with SEO data
 *
 * @module controllers/Product
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.prepend('Show', seo.ensureProductOfflineRedirection);
server.append('Show', seo.addSchemaData);

module.exports = server.exports();
