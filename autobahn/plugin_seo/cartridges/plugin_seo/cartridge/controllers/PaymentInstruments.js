'use strict';
// AUTOBAHN MODIFICATION addCurrentPageMetaData via append ignored, rely on route hook for PageMetaData

/**
 * Controller that enhance the PaymentInstruments controller with SEO data
 *
 * @module controllers/PaymentInstruments
 */

var server = require('server');
server.extend(module.superModule);

// var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Endpoints
 */
// server.append('List', seo.addCurrentPageMetaData);
// server.append('AddPayment', seo.addCurrentPageMetaData);

module.exports = server.exports();
