'use strict';

var base = module.superModule;

var HookManager = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

function passwordConstraintValidation(formField) {
    if (!dw.customer.CustomerMgr.isAcceptablePassword(formField.value)) {
        return new dw.web.FormElementValidationResult(false, Resource.msg('error.message.password.constraints.not.matched', 'forms', null));
    }
    return true;
}

/**
 * This function attempts to send an email that would notify the user that account was edited
 * @param {obj} profile - object that contains user's profile information.
*/
function sendAccountEditedEmail(registeredUser) {
    if (HookManager.hasHook('app.email.account.edited')) {
        try {
            var responseData = HookManager.callHook('app.email.account.edited', 'sendAccountEditedEmail', registeredUser);
            if (!responseData.EmailSuccessfullySent) {
                throw responseData.ErrorMessage;
            }
        } catch (ex) {
            Logger.error('Sending password reset email via hook encountered an unexpected error or the send was disabled in hook implementation; will send via base SFRA / SFCC. Error: \n\"' + ex + '\".');
            module.exports.sfraSendAccountEditedEmail(registeredUser);
        }
    } else {
        module.exports.sfraSendAccountEditedEmail(registeredUser);
    }
}

/**
 * This function attempts to send the account created email Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
*/
function sendCreateAccountEmail(registeredUser) {
    if (HookManager.hasHook('app.email.account.creation')) {
        try {
            var responseData = HookManager.callHook('app.email.account.creation', 'sendAccountCreationEmail', registeredUser);
            if (!responseData.EmailSuccessfullySent) {
                throw responseData.ErrorMessage;
            }
        } catch (ex) {
            Logger.error('Sending create account email via hook encountered an unexpected error or the send was disabled in hook implementation; will send via base SFRA / SFCC. Error: \n\"' + ex + '\".');
            module.exports.sfraCreateAccountEmail(registeredUser);
        }
    } else {
        module.exports.sfraCreateAccountEmail(registeredUser);
    }
}

function createAccountCreationPayload(registeredUser) {
    var payload = {};

    payload['EmailAddress'] = registeredUser.email || '';
    payload['FirstName'] = registeredUser.firstName || '';
    payload['LastName'] = registeredUser.lastName || '';
    // TODO: What format does the date need to be in?
    //payload['DateAdded'] = registeredUser.creationDate.toString() || '';

    return payload;
}

function createPasswordResetPayload(resettingCustomer) {
    var payload = {};
    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var resetUrl = dw.web.URLUtils.https('Account-SetNewPassword', 'Token', passwordResetToken).toString();

    payload['EmailAddress'] = resettingCustomer.profile.email || '';
    payload['FirstName'] = resettingCustomer.profile.firstName || '';
    payload['PWResetURL'] = resetUrl || '';

    return payload;
}

function createPasswordChangePayload(changingCustomer) {
    var payload = {};
    var passwordResetToken = getPasswordResetToken(changingCustomer);
    var accountHomeUrl = dw.web.URLUtils.https('Account-Show').toString();

    payload['EmailAddress'] = changingCustomer.profile.email || '';
    payload['FirstName'] = changingCustomer.profile.firstName || '';
    payload['LastName'] = changingCustomer.profile.lastName || '';
    payload['AccountHomeLink'] = accountHomeUrl || '';

    return payload;
}

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });

    return passwordResetToken;
}

/**
 * This function attempts to send password reset email via Marketing Cloud.
 * If failed or hook doesn't exist, it will send via traditional way
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 */
function sendPasswordResetEmail(email, resettingCustomer) {
    if (HookManager.hasHook('app.email.password.reset')) {
        try {
            var responseData = HookManager.callHook('app.email.password.reset', 'sendPasswordResetEmail', email, resettingCustomer);
            if (!responseData.EmailSuccessfullySent) {
                throw responseData.ErrorMessage;
            }
        } catch (ex) {
            Logger.error('Sending password reset email via hook encountered an unexpected error or the send was disabled in hook implementation; will send via base SFRA / SFCC. Error: \n\"' + ex + '\".');
            module.exports.sfraSendPasswordResetEmail(email, resettingCustomer);
        }
    } else {
        module.exports.sfraSendPasswordResetEmail(email, resettingCustomer);
    }
}

function sfraSendPasswordChangeEmail(customer) {
    var url = URLUtils.https('Login-Show');
    var objectForEmail = {
        firstName: customer.profile.firstName,
        lastName: customer.profile.lastName,
        url: url
    };

    var emailObj = {
        to: customer.profile.email,
        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.passwordChanged
    };

    emailHelpers.sendEmail(emailObj, 'account/password/newPasswordChangedEmail', objectForEmail);
}

function sendPasswordChangeEmail(email) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customer = CustomerMgr.getCustomerByLogin(email);

    if (customer && customer.profile) {
        if (HookManager.hasHook('app.email.password.changed')) {
            try {
                var responseData = HookManager.callHook('app.email.password.changed', 'sendPasswordChangeEmail', email, customer);
                if (!responseData.EmailSuccessfullySent) {
                    throw responseData.ErrorMessage;
                }
            } catch (ex) {
                Logger.error('Sending password change email via hook encountered an unexpected error or the send was disabled in hook implementation; will send via base SFRA / SFCC. Error: \n\"' + ex + '\".');
                module.exports.sfraSendPasswordChangeEmail(customer);
            }
        } else {
            module.exports.sfraSendPasswordChangeEmail(customer);
        }
    }
}

module.exports = {
    passwordConstraintValidation: passwordConstraintValidation,
    sendAccountEditedEmail: sendAccountEditedEmail,
    sendCreateAccountEmail: sendCreateAccountEmail,
    sendPasswordChangeEmail: sendPasswordChangeEmail,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sfraCreateAccountEmail: base.sendCreateAccountEmail,
    sfraSendAccountEditedEmail: base.sendAccountEditedEmail,
    sfraSendPasswordChangeEmail: sfraSendPasswordChangeEmail,
    sfraSendPasswordResetEmail: base.sendPasswordResetEmail,
    createPasswordChangePayload: createPasswordChangePayload,
    createAccountCreationPayload: createAccountCreationPayload,
    createPasswordResetPayload: createPasswordResetPayload
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
