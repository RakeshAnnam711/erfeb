'use strict';

$(document).ready(function() {
    // if there are no products on the page, remove this component
    if ($('.product-detail').length <= 1) {
        $('.page-designer-add-all-to-cart').remove();
    }
    //For Bundles: Hide elements of the page's products
    if ($('.product-bundle').length > 0) {
        var addToCartBtns = $('.qty-cart-container');
        // keep the first button on pdp pages
        var i = $('.page-designer').hasClass('pdp') ? 1 : 0;   
            for (i; addToCartBtns.length > i; i++) {
                $(addToCartBtns[i]).hide();
            }
    }
});