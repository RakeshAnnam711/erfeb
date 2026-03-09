
'use strict';

function validateGiftCertificateForm(giftCertificateForm) {
    var Resource = require('dw/web/Resource');

    var recipientEmailForm = giftCertificateForm.purchase.recipientEmail;
    var confirmRecipientEmailForm = giftCertificateForm.purchase.confirmRecipientEmail;

    if (recipientEmailForm.valid && confirmRecipientEmailForm.valid && (recipientEmailForm.value !== confirmRecipientEmailForm.value)) {
        recipientEmailForm.valid = false;
        confirmRecipientEmailForm.valid = false;
        confirmRecipientEmailForm.error = Resource.msg('giftcertificate.confirmrecipientemailvalueerror', 'forms', null);
        giftCertificateForm.valid = false;
    }

    var amountForm = giftCertificateForm.purchase.amount;
    if (amountForm.valid && ((amountForm.value < dw.system.Site.current.getCustomPreferenceValue('giftCertificateMin')) || (amountForm.value > dw.system.Site.current.getCustomPreferenceValue('giftCertificateMax')))) {
        amountForm.valid = false;
        amountForm.error = Resource.msg('giftcertificate.amountvalueerror', 'forms', null);
        giftCertificateForm.valid = false;
    }

    return giftCertificateForm;
}

/**
 * @param {Array<dw.order.GiftCertificate>} giftCertificates - gift certificates to email
 * @returns {dw.system.Status} status
 */
function sendGiftCertificateEmails(giftCertificates) {
    var Site = require('dw/system/Site');
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var Resource = require('dw/web/Resource');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var GiftCertificateModel = require('*/cartridge/models/giftCertificate/giftCertificate');
    var Logger = require('dw/system/Logger');
    var result = {error: false};

    for (var j in giftCertificates) {
        var giftCertificate = giftCertificates[j];
        var giftCertificateModel = new GiftCertificateModel({}, giftCertificate);

        var emailObj = {
            to: giftCertificate.recipientEmail,
            subject: Resource.msg('email.giftcertificate.ordergcemsg', 'checkout', null) + ' ' + giftCertificate.senderName,
            from: abConfigs.customerServiceEmail || 'no-reply@example.com',
            type: emailHelpers.emailTypes.orderConfirmation
        };

        result = emailHelpers.sendEmail(emailObj, 'giftCertificate/giftCertificateEmail', giftCertificateModel);
        if (result.error) {
            Logger.error('Failed to send gift certificate ' + giftCertificate.merchantID + ': CODE ' + result.code + ': MESSAGE ' + result.message);
            break;
        }
        Logger.info('Sent gift certificate ' + giftCertificate.merchantID);
    }

    return result;
}

/**
 * create a new gift certificate, must be called inside a Transaction, can throw an error
 * @param {dw.order.Order} order - order to be placed after containing gift certificate line items
 * @returns {Array<dw.order.GiftCertificate} array of newly created gift certificates
 */
function createGiftCertificates(order) {
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var GiftCertificate = require('dw/order/GiftCertificate');

    var giftCertificates = [];
    for (var i in order.giftCertificateLineItems) {
        var giftCertificateLineItem = order.giftCertificateLineItems[i];
        var giftCertificate = GiftCertificateMgr.createGiftCertificate(giftCertificateLineItem.priceValue);
        if (!giftCertificate) {
            var GiftCertificateLineItemModel = require('*/cartridge/models/giftCertificateLineItem/giftCertificateLineItem');
            var giftCertificateLineItemModel = new GiftCertificateLineItemModel({}, giftCertificateLineItem);
            throw new Error('Failed to create gift certificate: ' + JSON.stringify(giftCertificateLineItemModel));
        }
        giftCertificate.setRecipientEmail(giftCertificateLineItem.recipientEmail);
        giftCertificate.setRecipientName(giftCertificateLineItem.recipientName);
        giftCertificate.setSenderName(giftCertificateLineItem.senderName);
        giftCertificate.setMessage(giftCertificateLineItem.message);
        giftCertificate.setOrderNo(order.orderNo);
        giftCertificate.setStatus(GiftCertificate.STATUS_PENDING);
        giftCertificate.setEnabled(false);
        giftCertificates.push(giftCertificate);

        giftCertificateLineItem.giftCertificateID = giftCertificate.giftCertificateCode;
    }

    return giftCertificates;
}

/**
 * redeems a gift certificate payment instrument, must be called inside a Transaction, can throw an error
 * should only be called inside same transaction as placeOrder to eliminate possibility of draining balance on failed order
 * @param {dw.order.Order} order - order to be placed after containing gift certificate line items
 * @returns {dw.system.Status} status result
 */
function redeemGiftCertificates (order) {
    var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');

    for (var i in order.giftCertificatePaymentInstruments) {
        var giftCertificatePaymentInstrument = order.giftCertificatePaymentInstruments[i];
        var redeemStatus = GiftCertificateMgr.redeemGiftCertificate(giftCertificatePaymentInstrument);
        if (redeemStatus.error) {
            dw.system.Logger.error('Problem redeeming gift certificate ' + giftCertificatePaymentInstrument.giftCertificateCode + ': ' + redeemStatus.message)
            return redeemStatus;
        }
    }

    return new dw.system.Status(dw.system.Status.OK);
}

/**
 * This function tries to split recipient's full name into first and last name.
 * @param {string} fullName - recipient's full name
 * @param {string} EmailAddress - recipient's email
 * @returns an object consists of recipient's first name, last name, and email address
 */
function buildRecipientContactInfo(fullName, EmailAddress) {
    var recipientFirstName = 'n/a';
    var recipientLastName = 'n/a';

    if (!empty(fullName)) {
        var trimmedRecipientName = fullName.trim();
        recipientFirstName = trimmedRecipientName;

        if (!empty(trimmedRecipientName)) {
            var firstNameEndIndex = trimmedRecipientName.indexOf(' ');

            if (firstNameEndIndex > 0) {
                var lastNameStartIndex = trimmedRecipientName.lastIndexOf(' ');
                recipientLastName = trimmedRecipientName.substring(lastNameStartIndex + 1);
                recipientFirstName = trimmedRecipientName.substring(0, firstNameEndIndex);
            }
        }
    }

    var contactInfo = {
        "FirstName": recipientFirstName,
        "LastName": recipientLastName,
        "Email": EmailAddress
    };

    return contactInfo;
}

/**
 * This function has 2 possible actions, remove contact ID from session
 * or try to retrieve from Session, and if doesn't exist it will fetch from Service Cloud.
 * @param {string} recipientName - recipient's full name
 * @param {string} recipientEmail - recipient's email
 * @param {string} action - indicates which modification is needed: remove or get/create/save
 * @returns {string} contact ID (subscriber key)
 */
function modifyContactIdFromSession(recipientName, recipientEmail, action) {
    var contactId = recipientEmail;
    var useContactId = dw.system.Site.getCurrent().getCustomPreferenceValue('MarketingCloudUseContactIdForSubscriberKey');

    if (useContactId) {
        var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
        var serviceHelper = require('*/cartridge/scripts/helpers/ServiceHelper');
        var contactInfo = buildRecipientContactInfo(recipientName, recipientEmail);

        if (action === 'REMOVE') {
            serviceHelper.removeContactIdFromSession(contactInfo);
        } else {
            contactId = serviceManager.GetPersonAccountId(contactInfo);
        }
    }
    return contactId;
}

module.exports = {
    validateGiftCertificateForm: validateGiftCertificateForm,
    sendGiftCertificateEmails: sendGiftCertificateEmails,
    createGiftCertificates: createGiftCertificates,
    redeemGiftCertificates: redeemGiftCertificates,
    buildRecipientContactInfo: buildRecipientContactInfo,
    modifyContactIdFromSession: modifyContactIdFromSession
}
