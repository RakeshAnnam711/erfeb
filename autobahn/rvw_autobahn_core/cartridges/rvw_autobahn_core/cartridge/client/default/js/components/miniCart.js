'use strict';

var SiteConstants = require('constants/SiteConstants');
var updateMiniCart = true;

function setMiniCartBodyMaxHeight(minicart) {
    var $minicart = $(minicart);
    var $minicartScrollable = $minicart.find('.product-summary');
    var minicartHeight = $minicart.outerHeight();
    var minicartScrollableHeight = $minicartScrollable.outerHeight();
    var minicartNonScrollableHeight = minicartHeight - minicartScrollableHeight;
    var minicartOffset = $minicart.offset().top - $(window).scrollTop();
    var subtractHeight = minicartOffset + minicartNonScrollableHeight + SiteConstants.Spacer;

    // WGACA MODIFICATION - No max-height calc
    // $minicartScrollable.css('max-height', 'calc(100vh - ' + subtractHeight + 'px)');
}

module.exports = function () {
    $('.minicart').on('count:update', (event, count) => {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
            $('.minicart .minicart-link').attr({
                'aria-label': count.minicartCountOfItems,
                title: count.minicartCountOfItems
            });

            sessionStorage?.setItem?.('cartcount', count.quantityTotal);
        }
    });

    $('.minicart').on('mouseenter touchstart', () => {
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            if (!updateMiniCart && !$('.minicart .popover').is(':empty')) {
                $('.minicart .popover').addClass('show');
                return;
            }

            $('.minicart .popover').addClass('show');
            $('.minicart .popover').spinner().start();
            $.get(url, data => {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                updateMiniCart = false;
                $.spinner().stop();
                $('body').trigger('minicart:loaded', $('.minicart .popover'));
            });
        }
    });
    $('.minicart').on('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.keyCode === 40  || event.key === ' ' || event.keyCode === 32 || event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            if ($('.search:visible').length === 0) {
                return;
            }
            var url = $('.minicart').data('action-url');
            var count = parseInt($('.minicart .minicart-quantity').text(), 10);
    
            if (count !== 0 && $('.minicart .popover.show').length === 0) {
                if (!updateMiniCart && !$('.minicart .popover').is(':empty')) {
                    $('.minicart .popover').addClass('show');
                    return;
                }
    
                $('.minicart .popover').addClass('show');
                $('.minicart .popover').spinner().start();
                $.get(url, data => {
                    $('.minicart .popover').empty();
                    $('.minicart .popover').append(data);
                    updateMiniCart = false;
                    $.spinner().stop();
                    $('body').trigger('minicart:loaded', $('.minicart .popover'));
                });
            }
        }
    });

    $(document).on('focusin', function (event) {
        // Check if the focus has moved outside the popover
        if (!$(event.target).closest('.popover').length) {
            // Remove the 'show' class from the popover
            $('.popover').removeClass('show');
        }
    });

    $('body').on('touchstart click', event => {
        if ($('.minicart').has(event.target).length <= 0) {
            $('.minicart .popover').removeClass('show');
        }
    });

    $('.minicart').on('mouseleave focusout', event => {
        if ((event.type === 'focusout' && $('.minicart').has(event.target).length > 0)
            || (event.type === 'mouseleave' && $(event.target).is('.minicart .quantity'))
            || $('body').hasClass('modal-open')) {
            event.stopPropagation();
            return;
        }
        $('.minicart .popover').removeClass('show');
        $('body').trigger('minicart:mouseleave_focusout');
    });

    $('body').on('change', '.minicart .quantity', event => {
        if ($(event.target).parents('.bonus-product-line-item').length && $('.cart-page').length) {
            location.reload();
        }
    });

    $('body').on('product:afterAddToCart cart:update', () => {
        updateMiniCart = true;
    });

    $('body').on('minicart:loaded', (event, minicart) => {
        setMiniCartBodyMaxHeight(minicart);
    });

    $('body').on('product:preloadCartImages', (e, data) => {
        if (data.cart && data.cart.items && data.cart.items.length > 0) {
            data.cart.items.forEach(function (product) {
                if (product.images && product.images.small && product.images.small.length > 0) {
                    var img = new Image();
                    img.src = product.images.small[0].url; // Start preloading
                }
            });
        }
    });
};
