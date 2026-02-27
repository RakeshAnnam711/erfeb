'use strict';

/**
 * Controller that enhance the Checkout controller with SEO data
 *
 * @module controllers/Checkout
 */

var server = require('server');
server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
server.append('Begin', seo.addCurrentCheckoutStageMetaData);

module.exports = server.exports();
