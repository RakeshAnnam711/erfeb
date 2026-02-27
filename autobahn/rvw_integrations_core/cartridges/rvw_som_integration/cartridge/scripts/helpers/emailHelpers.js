'use strict';

var base = module.superModule;

var SOMConstants = require('*/cartridge/scripts/util/SOMConstants');

base.emailTypeAssets = base.emailTypeAssets || {};

// Create Base Email Type references to prevent lookup failure
[].concat(SOMConstants.systemOrderStatus).concat(SOMConstants.customLineItemStatus)
.forEach(function (status) {
    base.emailTypeAssets[status] = base.emailTypeAssets[status] || [];
});

// Setup Email Types explicit asset includes
//base.emailTypeAssets.ORDER_STATUS_CANCELLED = [ 'email-additional-content-asset-example' ];

module.exports = base;
