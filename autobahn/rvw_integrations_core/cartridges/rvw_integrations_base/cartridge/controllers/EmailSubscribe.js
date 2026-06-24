'use strict';

/**
 * @namespace EmailSubscribe
 */

var server = require('server');
server.extend(module.superModule);

/**
 * EmailSubscribe-Subscribe : The EmailSubscribe-Subscribe endpoint allows the shopper to submit their email address to be added to a mailing list. OOB SFRA does not have a mailing list feature however this endpoint call a hook would allow for a customer to easily allow for customization
 * @name Base/EmailSubscribe-Subscribe
 * @function
 * @memberof EmailSubscribe
 * @param {httpparameter} - emailId - Input field, The shopper's email address
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('Subscribe', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var HookMgr = require('dw/system/HookMgr');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var email = req.form.emailId;
    var firstname = null; // Modify controller to pass firstname
    var lastname = null; // Modify controller to pass lastname
    var source = res.viewData && res.viewData.action || null;
    var responseData = {
        success: false,
        error: true,
        msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
    };

    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    if (!empty(email) && emailHelpers.validateEmail(email)) {
        if (HookMgr.hasHook('app.mailingList.subscribe')) {
            // This can be overwritten by hook execution
            responseData.msg = null;

            hooksHelper('app.mailingList.subscribe', 'subscribe', [responseData, email, firstname, lastname, source], function () {
                // Hook Reponse must modify the first argument (responseData) JSON with success property == true
                // This argument will migrate with each registered hook call
            });

            // Default messaging if empty
            if (empty(responseData)) {
                responseData = {
                    success: false,
                    error: true,
                    msg: Resource.msg('subscribe.email.missing', 'homePage', null)
                };
            }
            else if (responseData.msg === null) {
                responseData.msg = Resource.msg('subscribe.email.' + (responseData.success ? 'success' : 'unknown'), 'homePage', null);
            }
        } else {
            responseData.msg = Resource.msg('subscribe.email.missing', 'homePage', null);
        }
    }

    res.json(responseData);
    next();
});


module.exports = server.exports();
