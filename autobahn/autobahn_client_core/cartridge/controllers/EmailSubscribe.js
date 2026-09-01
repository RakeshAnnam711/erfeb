'use strict';

var page = module.superModule;
var server = require('server');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
/**
 * @namespace EmailSubscribe
 */

 server.extend(page);

/**
 * EmailSubscribe-Subscribe : The EmailSubscribe-Subscribe enpoint allows the shopper to submit their eamil address to be added to a mailing list. OOB SFRA does not have a mailing list feature however this endpoint call a hook would allow for a customer to easily allow for custiomization
 * @name Base/EmailSubscribe-Subscribe
 * @function
 * @memberof EmailSubscribe
 * @param {httpparameter} - emailId - Input field, The shopper's email address
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('Subscribe', function (req, res, next) {
    var emailSubscribeHelpers = require('*/cartridge/scripts/helpers/EmailSubscribeHelpers');
        if (req.form.emailId && typeof req.form.emailId === 'string') {
            Transaction.wrap(function () {
                try {
                    // var createNewsletterSubscriber = CustomObjectMgr.createCustomObject('NewsletterSubscriber', req.form.emailId);
                    var uuid = UUIDUtils.createUUID();
                    var co = CustomObjectMgr.createCustomObject(
                        'ZetaNewsletterSubscriber',
                        uuid
                    );
                    co.custom.Email = req.form.emailId;
                    co.custom.source = 'footer_signup';
                } catch (error) {
                    Logger.error('Error creating NewsletterSubscriber custom object: {0}', error.message);
                }
            });
        } else {
            Logger.error('Invalid or undefined emailId provided in the request form.');
        }
    var email = req.form.emailId;
    var response = emailSubscribeHelpers.subscribeMail(email);
    res.json(response);
    next();
});


module.exports = server.exports();
