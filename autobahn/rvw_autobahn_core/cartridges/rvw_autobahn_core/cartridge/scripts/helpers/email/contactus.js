'use strict';​

function subscribe(contactFirstName, contactLastName, contactEmail, contactTopic, contactComment) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var customerServiceEmail = abConfigs.customerServiceEmail || 'no-reply@demandware.com';
    var Resource = require('dw/web/Resource');​
    var contextObj = {
        firstName: contactFirstName,
        lastName: contactLastName,
        email: contactEmail,
        topic: contactTopic,
        comment: contactComment
    };​
    var emailObj = {
        to: [customerServiceEmail, contextObj.email],
        subject: Resource.msg('subject.contact.us.email', 'contactUs', null),
        from: customerServiceEmail,
        type: emailHelpers.emailTypes.contactUs
    };​
    emailHelpers.sendEmail(emailObj, 'contactUs/contactUsEmail', contextObj);
}​
exports.subscribe = subscribe;
