'use strict';

var base = module.superModule;
var totalsDecorators = require('*/cartridge/models/totals/decorators/index');

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function TotalsModel(lineItemContainer) {
    base.call(this, lineItemContainer);
    totalsDecorators.subTotal(this, lineItemContainer);
    totalsDecorators.grandTotalValueOrNull(this, lineItemContainer);
    totalsDecorators.giftCertificatePaymentInstrumentsTotal(this, lineItemContainer);
    totalsDecorators.grandTotalLessGiftCertificatePaymentInstruments(this, lineItemContainer);
    totalsDecorators.giftCertificatePaymentInstrumentsLabel(this, lineItemContainer);
}

module.exports = TotalsModel;
