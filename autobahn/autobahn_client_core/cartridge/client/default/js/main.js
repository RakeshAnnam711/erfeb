'use strict';

var integrations = require('integrations/main');

integrations.baseFiles.cart = require('./cart');
integrations.baseFiles.footer = require('./components/footer');
integrations.baseFiles.base = require('./product/base');
integrations.baseFiles.meter = require('./product/meter');
integrations.baseFiles.search = require('./components/search');
integrations.baseFiles.megamenu = require('./components/megamenu');
integrations.baseFiles.countryselector = require('./components/countrySelector');
integrations.baseFiles.loginForm = require('./login/loginForm');
integrations.baseFiles.paymentOptions = require('./checkout/billing/paymentOptions');
integrations.baseFiles.toast = require('./components/toast');

require('./thirdParty/lazysizes.min');
integrations.baseFiles.tagManager = require('./components/tagManager');

integrations.baseFiles.productClickTracker = require('./productClickTracker');
module.exports = integrations;

