'use strict';

module.exports = {
    subTotal: require('*/cartridge/models/totals/decorators/subTotal'),
    grandTotalValueOrNull: require('*/cartridge/models/totals/decorators/grandTotalValueOrNull'),
    giftCertificatePaymentInstrumentsTotal: require('*/cartridge/models/totals/decorators/giftCertificatePaymentInstrumentsTotal'),
    grandTotalLessGiftCertificatePaymentInstruments: require('*/cartridge/models/totals/decorators/grandTotalLessGiftCertificatePaymentInstruments'),
    giftCertificatePaymentInstrumentsLabel: require('*/cartridge/models/totals/decorators/giftCertificatePaymentInstrumentsLabel')
}
