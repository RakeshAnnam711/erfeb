
'use strict';

module.exports = {
    // AB doesn't want extra buttons on minicart, but enabling this code will allow that
    // onCybersourceMiniCartLoaded: function () {
    //     $('body').on('minicart:loaded', (event, minicart) => {
    //         var isPaypalEnabled = !!($('#paypal_enabled').length > 0 && document.getElementById('paypal_enabled').value == 'true');
    //         var isGooglePayEnabled = !!($('#isGooglePayEnabled').length > 0 && $('#isGooglePayEnabled').val() == 'true');

    //         if (isPaypalEnabled) {
    //             paypalhelper.paypalMini();
    //         }
    //         if (isGooglePayEnabled) {
    //             onGooglePayLoaded();
    //         }
    //     });
    // },
    onCybersourceMiniCartMouseLeaveFocusOut: function () {
        $('body').on('minicart:mouseleave_focusout', (event, minicart) => {
            if (!($(document).find('.paypal-checkout-sandbox').length > 0)) {
                $('.minicart .popover').empty();
                $('.minicart .popover').removeClass('show');
            }
        })
    }
}
