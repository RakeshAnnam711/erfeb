'use strict';

module.exports = {
    methods: {
        afterApplePayTagReplacement: function(data) {
            var checkoutPaymentTab = $('.nav-item.applepay-tab-wrapper');
            if (checkoutPaymentTab.length === 1) {
                checkoutPaymentTab.removeAttr('hidden');
            }
            var container;
            if (data && data.target) {
                container = $(data.target).find('.js-paymentmethodwarning-msgcontainer');
            } else {
                container = $('#applepay-content .js-paymentmethodwarning-msgcontainer');
            }
            if (container) {
                container.attr('data-iframepresent', true);
                container.data('iframepresent', true);
                $('body').trigger('PaymentMethodObserver:iframePresent');
            }
        }
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            var $productContainer = response.$productContainer;
            var appleButton = $productContainer.find('button.dw-apple-pay-button');

            if (appleButton && appleButton.length) {
                $('body').trigger('PaymentMethodObserver:Show', { name: 'available', show: (!response.product.readyToOrder || !response.product.available) })
                appleButton.attr('sku', response.product.id);
            }
        });
    },
    detectIsApplePayTagReplacement: function () {
        //can handle running before or after replacement by internal demandware applepay script
        var applePayTag = $('isapplepay');
        if (applePayTag.length === 0) {
            module.exports.methods.afterApplePayTagReplacement();
        } else {
            $('body').on('PaymentMethodObserver:AddNode', function (e, data) {
                if (data && data.addNode && data.addNode.classList){
                    for (var className of data.addNode.classList) {
                        if (className === 'dw-apple-pay-button') {
                            module.exports.methods.afterApplePayTagReplacement(data);

                            data.observer.disconnect();
                            return;
                        }
                    }
                }
            })
        }
    }
}
