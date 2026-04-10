'use strict';

/**
 * Controller that enhance the Login controller with SEO data
 *
 * @module controllers/Login
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.append('Show', seo.addSchemaData); // AUTOBAHN MODIFICATION rely on route hook for PageMetaData
// server.append('Show', seo.addCurrentPageMetaData, seo.addSchemaData);
// server.append('OAuthLogin', seo.addCurrentPageMetaData);
// server.append('OAuthReentry', seo.addCurrentPageMetaData);

module.exports = server.exports();
