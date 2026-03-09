'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

var run = function () {
    var GiftCertificateModel = require('*/cartridge/models/giftCertificate/giftCertificate');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var objects = CustomObjectMgr.getAllCustomObjects('GiftCertificateEmailQueue');
    var totalObjects = objects.count;
    var count = 0;

    if (totalObjects > 0) {
        while (objects.hasNext()) {
            var emailObject = objects.next();
            var merchantID = emailObject.custom.giftCertificateMerchantID;

            try {
                var giftCertificate = GiftCertificateMgr.getGiftCertificateByMerchantID(merchantID);

                if (giftCertificate && giftCertificate.enabled && !empty(giftCertificate.recipientEmail) && giftCertificate.status !== 0) {
                    var giftCertificateModel = new GiftCertificateModel({}, giftCertificate);

                    var emailObj = {
                        to: giftCertificate.recipientEmail,
                        subject: Resource.msg('email.giftcertificate.ordergcemsg', 'checkout', null) + ' ' + giftCertificate.senderName,
                        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@example.com',
                        type: emailHelpers.emailTypes.orderConfirmation,
                    };

                    var result = emailHelpers.sendEmail(emailObj, 'giftCertificate/giftCertificateEmail', giftCertificateModel);

                    if (result.error) {
                        Logger.error('Error sending gift certificate ' + giftCertificate.merchantID + ': CODE ' + result.code + ': MESSAGE ' + result.message);
                    } else {
                        Transaction.wrap(function () {
                            CustomObjectMgr.remove(emailObject);
                        });

                        Logger.info('Sent gift certificate email with merchant ID {0} to {1}.', merchantID, giftCertificate.recipientEmail);
                        count++;
                    }
                } else {
                    Logger.info('Skipping sending gift certificate email with merchant ID {0} because it is either not enabled, has a pending status, or is missing the recipient email.', merchantID);
                }
            } catch (e) {
                Logger.error('Error sending gift certificate email for merchant ID {0}. Error message: {1}', merchantID, e);
            }
        }

        Logger.info('Emailed {0} out of {1} gift certificates in the queue.', count, totalObjects);
    } else {
        Logger.info('No gift certificate emails in the queue.');
    }
};

exports.run = run;
