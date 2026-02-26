'use strict';

function updateRequestForGiftCertificatePaymentInstruments(basket, applepayResponse) {
    //Adyen does not support GCPI
    if (!dw.system.Site.current.getCustomPreferenceValue('adyenCartridgeEnabled')) {
        var Transaction = require('dw/system/Transaction');
        var TotalsModel = require('*/cartridge/models/totals');
        var totalsModel = new TotalsModel(basket);

        if (totalsModel.giftCertificatePaymentInstrumentsTotalValue) {
            applepayResponse.lineItems.push({
                amount: '-' + totalsModel.giftCertificatePaymentInstrumentsTotalValue,
                label: totalsModel.giftCertificatePaymentInstrumentsLabel,
                type: "final"
            })
            var gcpi = [];
            for (var i in basket.giftCertificatePaymentInstruments) {
                var giftCertificatePaymentInstrument = basket.giftCertificatePaymentInstruments[i];
                gcpi.push(giftCertificatePaymentInstrument.giftCertificateCode);
            }
            Transaction.wrap(function() {
                var notes = basket.notes.iterator();
                while (notes.hasNext()) {
                    var note = notes.next();
                    if (note.subject === 'giftCertificatePaymentInstrumentsForApplePay') {
                        basket.removeNote(note);
                    }
                }

                basket.addNote('giftCertificatePaymentInstrumentsForApplePay', gcpi.join(','));
            })
        } else {
            Transaction.wrap(function() {
                var notes = basket.notes.iterator();
                while (notes.hasNext()) {
                    var note = notes.next();
                    if (note.subject === 'giftCertificatePaymentInstrumentsForApplePay') {
                        basket.removeNote(note);
                        break;
                    }
                }
            })
        }
        applepayResponse.total.amount = totalsModel.grandTotalLessGiftCertificatePaymentInstrumentsValue;
    }
}

function calculateAvailableShippingMethods(basket, applepayRequest) {
    if (basket.defaultShipment) {
        var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
        var shippingMethods = shippingHelpers.getApplicableShippingMethods(basket.defaultShipment);
        var newShip = [];
        for (var appleShip of applepayRequest.shippingMethods) {
            for (var shippingMethod of shippingMethods) {
                if (shippingMethod.ID === appleShip.identifier && !shippingMethod.storePickupEnabled) {
                    newShip.push(appleShip);
                }
            }
        }

        applepayRequest.shippingMethods = newShip;
    }
}

exports.updateRequestForGiftCertificatePaymentInstruments = updateRequestForGiftCertificatePaymentInstruments;

exports.calculateAvailableShippingMethods = calculateAvailableShippingMethods;

exports.getRequest = function (basket, applepayRequest) {
    calculateAvailableShippingMethods(basket, applepayRequest);
    updateRequestForGiftCertificatePaymentInstruments(basket, applepayRequest);
};

exports.shippingContactSelected = function (basket, event, applepayResponse) {
    calculateAvailableShippingMethods(basket, applepayResponse);
    updateRequestForGiftCertificatePaymentInstruments(basket, applepayResponse);
};

exports.shippingMethodSelected = function (basket, shippingMethod, event, applepayResponse) {
    updateRequestForGiftCertificatePaymentInstruments(basket, applepayResponse);
};

exports.paymentMethodSelected = function (basket, event, applepayResponse) {
    updateRequestForGiftCertificatePaymentInstruments(basket, applepayResponse);
};

exports.createOrder = function (basket, event) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var Transaction = require('dw/system/Transaction');
    var gcpi = [];
    var notes = basket.notes.iterator();
    while (notes.hasNext()) {
        var note = notes.next();
        if (note.subject === 'giftCertificatePaymentInstrumentsForApplePay') {
            gcpi = note.text.split(',');
            Transaction.wrap(function() {
                basket.removeNote(note);
            })
            break;
        }
    }

    if (gcpi.length && !basket.giftCertificateLineItems.length) {
        var GiftCertificateMgr = require('dw/order/GiftCertificateMgr');
        var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        for (var j in gcpi) {
            var giftCertificateCode = gcpi[j];
            var giftCertificate = GiftCertificateMgr.getGiftCertificateByCode(giftCertificateCode);
            if (giftCertificate
                && giftCertificate.balance.valueOrNull
                && giftCertificate.enabled
                && giftCertificate.status !== dw.order.GiftCertificate.STATUS_PENDING
                && giftCertificate.status !== dw.order.GiftCertificate.STATUS_REDEEMED
                && giftCertificate.balance.currencyCode === basket.currencyCode) {
                checkoutHelpers.applyGiftCertificateToBasket(giftCertificate, basket);
            }
        }

        // Calculate the basket
        Transaction.wrap(function () {
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            basketCalculationHelpers.calculateTotals(basket);
        });
        // Calculate how much to actually charge to apple pay card
        COHelpers.calculatePaymentTransaction(basket)
    }

    Transaction.wrap(function() {
        basket.billingAddress.phone = event.payment.shippingContact.phoneNumber;
    })
    // WGACA MODIFICATION - Additional logging
    dw.system.Logger.warn("rvw_integrations_core:applepay: create order started for the customer "+basket.customerEmail+" :");
    var order = COHelpers.createOrder(basket);
    // WGACA MODIFICATION - Additional logging
    dw.system.Logger.warn("rvw_integrations_core:applepay: create order completed for the customer "+basket.customerEmail+" :");
    return order;
}

