/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

'use strict';

exports.getUrlParameters = function (basket) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var params = {};

    if (session.userName !== 'storefront' && session.userAuthenticated) {
        params[globaleHelpers.customAttr.order.geIsOrderCreatedPayByLinkScenario] = true;
    }

    return params;
};
