'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var newsletterSubscriberHelper = require('*/cartridge/scripts/helpers/NewsletterSubscriberHelper');

server.post('SignUp', function (req, res, next) {

    try {
        var body = JSON.parse(req.body);

        var email = body.emailId;

        if (newsletterSubscriberHelper.validateEmail(email)){
            newsletterSubscriberHelper.signUp(email);
            newsletterSubscriberHelper.postEmailToSFMC(email);
            res.json({
                success: true,
                msg: Resource.msg('newslettersubscriber.js.signup.success.msg', 'newslettersubscriber', null)
            });
        } else {
            res.json({
                error: true,
                msg: Resource.msg('newslettersubscriber.js.invalid.email.error.msg', 'newslettersubscriber', null)
            });
        }
    } catch(err) {
        if (err && err.javaMessage && err.javaMessage.includes("Key is not unique")) {
            res.json({
                error: true,
                msg: Resource.msg('newslettersubscriber.js.duplicate.email.error.msg', 'newslettersubscriber', null)
            });
        } else {
            res.json({
                error: true,
                msg: Resource.msg('newslettersubscriber.js.signup.error.msg', 'newslettersubscriber', null)
            });
        }
    }

    next();
});

module.exports = server.exports();
