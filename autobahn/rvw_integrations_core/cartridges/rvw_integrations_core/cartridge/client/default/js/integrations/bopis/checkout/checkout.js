"use strict";

module.exports = {
    updateCheckoutViewPaymentInformationBopis: function updateCheckoutViewPaymentInformationBopis (e, data) {
        $('body').on('checkout:updateCheckoutViewPaymentInformation', function (e, data) {
            var form = $('form[name$=billing]')[0];
            if (data && data.order && data.order.totals && data.order.totals.giftCertificatePaymentInstrumentsTotalValue && !data.order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
                $(form).attr('data-address-mode', 'new');
            } else {
                $(form).attr('data-address-mode', 'edit');
            }
        });
    }
};
