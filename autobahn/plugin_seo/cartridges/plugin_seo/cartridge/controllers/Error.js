'use strict';
// AUTOBAHN MODIFICATION addCurrentPageMetaData via append ignored, rely on route hook for PageMetaData

/**
 * Controller that enhance the Error controller with SEO data
 *
 * @module controllers/Error
 */

var server = require('server');
server.extend(module.superModule);

// var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
// server.append('Start', seo.addCurrentPageMetaData);
// server.append('ErrorCode', seo.addCurrentPageMetaData);

module.exports = server.exports();
