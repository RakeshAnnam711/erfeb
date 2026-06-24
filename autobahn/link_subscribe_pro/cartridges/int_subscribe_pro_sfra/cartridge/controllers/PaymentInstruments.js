'use strict';

/* eslint no-unused-vars: 0 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var paymentsHelper = require('~/cartridge/scripts/subpro/helpers/paymentsHelper');
var subproEnabled = require('dw/system/Site').getCurrent().getCustomPreferenceValue('subproEnabled');

var page = module.superModule;
server.extend(page);

server.append('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    if (subproEnabled) {
        var viewData = res.getViewData();

        var newCard = session.privacy.newCard ? JSON.parse(session.privacy.newCard) : null;
        var deletedCard = session.privacy.deletedCard ? JSON.parse(session.privacy.deletedCard) : null;

        session.privacy.newCard = null;
        session.privacy.deletedCard = null;

        var newCardSfccId = newCard ? newCard.sfcc.UUID : null;
        var newCardPayload = newCard ? { payment_profile: newCard.sp } : null;
        var deletedCardPayload = deletedCard ? { payment_profile: deletedCard.sp } : null;

        viewData.newCardSfccId = newCardSfccId;
        viewData.newCard = JSON.stringify(newCardPayload);
        viewData.deletedCard = JSON.stringify(deletedCardPayload);

        res.setViewData(viewData);
    }
    next();
});

server.get('SetSPPaymentProfileID', function (req, res, next) {
    var wallet = customer.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments('CREDIT_CARD');
    var paymentInstrumentId = req.querystring.paymentInstrumentId;

    var paymentInstrument = null;
    for (var i in paymentInstruments) {
        if (paymentInstrumentId == paymentInstruments[i].getUUID()) {
            paymentInstrument = paymentInstruments[i];
        }
    }

    var success = paymentInstrument != null;

    if (success) {
        paymentsHelper.setSubproPaymentProfileID(paymentInstrument, req.querystring.spPaymentProfileId);
    }
    res.json({ success: success });
    next();
});

server.append('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    if (!subproEnabled) {
        return next();
    }
    this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.success) {
            var cardNum = viewData.cardNumber;
            var last4 = cardNum.substring(cardNum.length - 4);
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();
            var savedCard = null;
            var savedCards = wallet.getPaymentInstruments('CREDIT_CARD');
            for (var i = 0; i < savedCards.length; i++) {
                if (savedCards[i].getCreditCardNumberLastDigits() == last4) {
                    savedCard = savedCards[i];
                    break;
                }
            }
            if (!savedCard) {
                return next();
            }

            session.privacy.newCard = JSON.stringify({
                sp: paymentsHelper.getSubscriptionPaymentProfile(session.customer.profile, savedCard, {}, false),
                sfcc: savedCard.UUID
            });
        }
    });
    return next();
});

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        return next();
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var payment = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });
    session.privacy.deletedCard = JSON.stringify({
        sp: paymentsHelper.getSubscriptionPaymentProfile(session.customer.profile, payment.raw, {}, true),
        sfcc: payment.UUID
    });

    return next();
});

module.exports = server.exports();
