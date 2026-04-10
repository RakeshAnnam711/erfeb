'use strict';

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

function subscribeMail(email) {
    var Resource = require('dw/web/Resource');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var newsletterSubscriberHelper = require('*/cartridge/scripts/helpers/NewsletterSubscriberHelper');
    var isValidEmailid;
    if (email) {
        isValidEmailid = validateEmail(email);

        if (isValidEmailid) {
            hooksHelper('app.mailingList.subscribe', 'subscribe', [{"email": email }], function () {});
            var response = newsletterSubscriberHelper.postEmailToSFMC(email);
            return {
                sfmcResponse: response,
                success: true,
                msg: Resource.msg('subscribe.email.success', 'homePage', null),
                email:email
            };
        } else {
            return {
                error: true,
                msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
            };
        }
    } else {
        return {
            error: true,
            msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
        };
    }
}

module.exports = {
    subscribeMail: subscribeMail
};
