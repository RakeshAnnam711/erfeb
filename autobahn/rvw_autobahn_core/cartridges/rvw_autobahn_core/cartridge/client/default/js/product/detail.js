'use strict';

module.exports = {
    updateAttributes: function() {
        $('body').on('product:statusUpdate', function (e, data) {
            var $productContainer = $('.product-detail[data-pid="' + data.id + '"]');

            $productContainer.find('.main-content-group .product-attributes')
                .empty()
                .html(data.attributesHtml);

            $('body').trigger('tooltip:init');
            if ($('button.add-to-cart-global').length) {
                module.exports.updateAddAllToCart();
            }
        });
    },
    updateHeadlinesAndTabs: function() {
        $('body').on('product:afterAttributeSelect', function (e, data) {
            if (data && data.data && data.data.product && data.container) {
                var $productContainer = data.container;
                var product = data.data.product;

                if (product.headline) {
                    $productContainer.find('.product-headline')
                        .show()
                        .html(product.headline);
                } else {
                    $productContainer.find('.product-headline')
                        .hide();
                }

                if (product.headlineDescription) {
                    $productContainer.find('.product-headlinedescription')
                        .show()
                        .html(product.headlineDescription);
                } else {
                    $productContainer.find('.product-headlinedescription')
                        .hide();
                }
            }
        });
    },
    updateCollapsibleContent: function() {
        $('body').on('product:afterAttributeContentSwap', function (e, data) {
            module.exports.setCollapsibleContentState((data && data.container) ? data.container : '');
        });
    },
    updateAddAllToCart: function () {
        // if default variants are selected, enable the add all to cart btn on load
        if ($('button.add-to-cart-global').length) {
            var enable = $('.product-availability').toArray().every(function (item) {
                return $(item).data('available') && $(item).data('ready-to-order');
            });
            $('button.add-to-cart-global').attr('disabled', !enable);
        }
    },
    copyProductLink: function () {
        $('body').on('click', '#fa-link', function () {
            event.preventDefault();
            var $temp = $('<input>');
            $('body').append($temp);
            $temp.val($('#shareUrl').val()).select();
            document.execCommand('copy');
            $temp.remove();
            $('.copy-link-message').attr('role', 'alert');
            $('.copy-link-message').removeClass('d-none').addClass('toast-messages');
            setTimeout(function () {
                $('.copy-link-message').addClass('d-none').removeClass('toast-messages');
            }, 3000);
        });
    },
    showSpinner: function() {
        $('body').on('product:beforeAddToCart product:beforeAttributeSelect', function () {
            $.spinner().start();
        });
    },
    setCollapsibleContentState: function ($container) {
        var $collapsibleContentGroup;

        if ($container) {
            $collapsibleContentGroup = $container.find('.collapsible-content-group');
        } else {
            $collapsibleContentGroup = $('.collapsible-content-group');
        }

        $collapsibleContentGroup.each(function () {
            var expandCollapsibleContentGroup = $(this).data('expand');
            if (expandCollapsibleContentGroup == true) {
                $(this).addClass('active');
            }
        });
    }
};
