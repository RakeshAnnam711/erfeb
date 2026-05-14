'use strict';

/**
 * Controller that enhance the Search controller with SEO data
 *
 * @module controllers/Search
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.prepend('Show', seo.ensureCategoryOfflineRedirection);
server.append('Show', seo.addSchemaData);

module.exports = server.exports();
