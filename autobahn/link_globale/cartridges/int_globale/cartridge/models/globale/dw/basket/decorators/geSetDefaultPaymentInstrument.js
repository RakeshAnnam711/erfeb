'use strict';

/**
 * Sets basket default payment instrument
 */
function geSetDefaultPaymentInstrument() {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Money = require('dw/value/Money');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');

    // remove All Payment Instruments
    collections.forEach(this.getPaymentInstruments(), function (pInstrument) {
        this.removePaymentInstrument(pInstrument);
    }, this);

    // create GLOBALE payment instrument
    var globalePMethod = PaymentMgr.getPaymentMethod(globaleHelpers.paymentMethod.GLOBALE);
    this.createPaymentInstrument(globalePMethod.ID, new Money(0, this.getCurrencyCode()));
}

module.exports = function (object) {
    Object.defineProperty(object, 'geSetDefaultPaymentInstrument', {
        value: geSetDefaultPaymentInstrument
    });
};
