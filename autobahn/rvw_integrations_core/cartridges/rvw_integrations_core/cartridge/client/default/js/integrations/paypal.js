'use strict';

//This file is intended for use with the standalone paypal plugin

module.exports = {
    methods: {
        afterPayPalIframe: function(data) {
            var container;
            if (data && data.target) {
                container = $(data.target).find('.js-paymentmethodwarning-msgcontainer');
            } else {
                container = $('.js-paypal-checkout.js-paymentmethodwarning-msgcontainer');
            }
            if (container) {
                container.attr('data-iframepresent', true);
                container.data('iframepresent', true);
                $('body').trigger('PaymentMethodObserver:iframePresent');
            }
        }
    },
    detectPayPalIframe: function () {
        //can handle running before or after replacement by paypal blob
        var paypalIframe = $('.paypal-buttons-context-iframe');
        if (paypalIframe.length === 1) {
            module.exports.methods.afterPayPalIframe();
        } else {
            $('body').on('PaymentMethodObserver:AddNode', function (e, data) {
                if (data && data.addNode && data.addNode.classList){
                    for (var className of data.addNode.classList) {
                        if (className === 'paypal-buttons-context-iframe') {
                            module.exports.methods.afterPayPalIframe(data);

                            data.observer.disconnect();
                            return;
                        }
                    }
                }
            })
        }
    }
}
