'use strict';

var server = require('server');
server.extend(module.superModule);

function logoutCustomer (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    CustomerMgr.logoutCustomer(false);

    next();
};

/**
 * CSRF-Fail : The CSRF-Fail endpoint is responsible for rendering the CSRF token mismatch error page
 * @name Base/CSRF-Fail
 * @function
 * @memberof CSRF
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Fail', logoutCustomer);

/**
 * CSRF-AjaxFail : The CSRF-AjaxFail endpoint is responsible for handling CSRF token mismatch in ajax requests
 * @name Base/CSRF-AjaxFail
 * @function
 * @memberof CSRF
 * @param {category} - non-sensitive
 * @param {returns} - imsl
 * @param {serverfunction} - get
 */
server.append('AjaxFail', logoutCustomer);


module.exports = server.exports();
