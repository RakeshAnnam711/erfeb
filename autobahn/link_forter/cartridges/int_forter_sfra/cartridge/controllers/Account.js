'use strict';

// Local Modules
var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.prepend(
    'Login',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();

            if (viewData.authenticatedCustomer) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_LOGIN,
                    customer: customer,
                    request: request
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        return next();
    }
);

server.append(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();

            if (viewData.authenticatedCustomer) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_CREATE,
                    customer: customer,
                    request: request
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        return next();
    }
);

server.append(
    'SaveProfile',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var profile = customer.getProfile();

            if (profile) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE,
                    customer: customer,
                    request: request
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        return next();
    }
);

module.exports = server.exports();
