'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/**
 * @param {array} giftCertificates - array of GCs
 */
function sendGiftCertificates (giftCertificates) {
    var URLUtils = require('dw/web/URLUtils');
    var HookMgr = require('dw/system/HookMgr');
    var status = {error: false};

    if (HookMgr.hasHook('app.email.giftCertificate.recipient')) {
        try {
            //build out a giftCertificateLineItems array with needed info for createGiftCertificateRecipientEmailPayload
            var giftCertificateLineItems =  giftCertificates.map(gc => gc != null ? {
                                                lineItemText: Resource.msg('giftcertificate.purchase.giftcertificate', 'checkout', null),
                                                price: {value: gc.amount}
                                            } : '');
            var giftCertificatesDetails = {
                hostName: URLUtils.home().toString(),
                giftCertificates: giftCertificates,
                giftCertificateLineItems: giftCertificateLineItems,
                giftCertificateImage: URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, '', 'images/gift-certificates.png', null).toString()
            };
            var responseData = HookMgr.callHook('app.email.giftCertificate.recipient', 'sendGiftCertificateRecipientEmails', giftCertificatesDetails);

            if (!responseData || !responseData.EmailSuccessfullySent) {
                throw responseData;
            }
        } catch (e) {
            Logger.error('Sending gift certificate email(s) via hook encountered an unexpected error; will send via base SFRA / SFCC. Error: \n\"' + JSON.stringify(e) + '\".');

            var failedGiftCertificateList = responseData && 'failedGiftCertificateList' in responseData && responseData.failedGiftCertificateList.length > 0 ? responseData.failedGiftCertificateList : giftCertificates;
            status = module.exports.loopThroughGiftCertificatesAndSendViaSFRA(failedGiftCertificateList);
        }
    } else {
        status = module.exports.loopThroughGiftCertificatesAndSendViaSFRA(giftCertificates);
    }

    return status;
}

/**
 * @param {array} giftCertificates - array of GCs
 */
function loopThroughGiftCertificatesAndSendViaSFRA (giftCertificates) {
    var status = {error: false};
    giftCertificates.forEach(function (giftCert) {
        try {
            var result = module.exports.sendGiftCertificateEmailViaSFRA(giftCert);
            if (result.error) {
                status.error = true;
            }
        } catch (e) {
            Logger.error('Failed to send gift certificate ' + giftCert.maskedGiftCertificateCode + ' from order: ' + giftCert.orderNo);
        }
    });
    return status;
}

/**
 * @param {giftCertificateModel} - Single gift certificate to email
 */
 function sendGiftCertificateEmailViaSFRA (giftCertificateModel) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var result = {error: false};

    var emailObj = {
        to: giftCertificateModel.recipientEmail,
        subject: Resource.msg('email.giftcertificate.ordergcemsg', 'checkout', null) + ' ' + giftCertificateModel.senderName,
        from: abConfigs.customerServiceEmail || 'no-reply@example.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    result = emailHelpers.sendEmail(emailObj, 'giftCertificate/giftCertificateEmail', giftCertificateModel);

    if (result.error) {
        result.error = true;
        Logger.error('Failed to send gift certificate ' + giftCertificateModel.merchantID + ': CODE ' + result.code + ': MESSAGE ' + result.message);
    }

    return result;
}

/**
 * If No ExternalSystem to activate gift certs, activate them (array) during the order, add a note to order if anything fails
 * @param {array} giftCertificates -  array of GCs
 * @param {dw.order.Order} order - The order object to be placed
 */
function activateGiftCertificatesFromOrder (giftCertificates, order) {
    try {
        giftCertificates.forEach( function (giftCert) {
            var status = module.exports.activateGiftCertificate(giftCert);

            if (!status) {
                Transaction.wrap( function () {
                    order.addNote('Failed to activate gift certificate: ' + giftCert.giftCertificateCode + '. \nDetails: ', e.message);
                });
            }
        });
    } catch (e) {
        Transaction.wrap( function () {
            order.addNote('Failed to activate gift certificate(s) (code error)', e.message);
        });
    }
}

/**
 * @param {object} giftCertificate - Single giftCertificate can be GC object model or lineItem with giftCertificateID (aka: giftCertificateCode)
 * @returns {boolean} gift certificate activation status
 */
function activateGiftCertificate (giftCertificate) {
    if (!giftCertificate) {
        Logger.error("activateGiftCertificate hook could not be triggered, giftCertificate was not found.");
    } else {
        var GiftCertificateModel = require('*/cartridge/models/giftCertificate/giftCertificate');
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        var GiftCertificate = require('dw/order/GiftCertificate');
        var giftCertificate = Object.assign({}, giftCertificate);
        var giftCertificateCode = giftCertificate.giftCertificateID || giftCertificate.giftCertificateCode;

        // find the Gift Certificate that was created during the order
        var giftCertificateBM = GiftCertificateMgr.getGiftCertificate(giftCertificateCode);
        var giftCertificateModel = new GiftCertificateModel({}, giftCertificateBM);

        var status = {};

        Transaction.begin();
        try {
            // enable the Gift Certificate that was created during the order
            giftCertificateBM.setStatus(GiftCertificate.STATUS_ISSUED);
            giftCertificateBM.setEnabled(true);

            //Sends the email to Gift Certificate Recipient
            status = module.exports.sendGiftCertificates([giftCertificateModel]);

        } catch (e) {
            Logger.error('Failed to enable gift certificate ' + giftCertificateBM.maskedGiftCertificateCode);
            Transaction.rollback();
            return false;
        }

        if (status.error) {
            Logger.error('Failed to send gift certificate ' + giftCertificate.merchantID + ': CODE ' + giftCertificateBM.maskedGiftCertificateCode + ': MESSAGE ' + status.message);
            Transaction.rollback();
            return false;
        }

        Logger.info('Sent gift certificate ' + giftCertificateBM.maskedGiftCertificateCode);

        Transaction.commit();

        return true;
    }

    return false;
}


module.exports = {
    activateGiftCertificate: activateGiftCertificate,
    activateGiftCertificatesFromOrder: activateGiftCertificatesFromOrder,
    sendGiftCertificates: sendGiftCertificates,
    loopThroughGiftCertificatesAndSendViaSFRA: loopThroughGiftCertificatesAndSendViaSFRA,
    sendGiftCertificateEmailViaSFRA: sendGiftCertificateEmailViaSFRA
};
