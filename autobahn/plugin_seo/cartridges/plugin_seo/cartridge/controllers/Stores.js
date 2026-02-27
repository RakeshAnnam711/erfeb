'use strict';

/**
 * Controller that enhance the Stores controller with SEO data
 *
 * @module controllers/Stores
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.append('Find', seo.addSchemaData); // AUTOBAHN MODIFICATION rely on route hook for PageMetaData
// server.append('Find', seo.addCurrentPageMetaData, seo.addSchemaData);

module.exports = server.exports();
