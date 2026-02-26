'use strict';

var wishlistHelpers = require('core/wishlist/components/helpers');
var toastHelpers = require('core/components/toast');

var swatchChange =function($swatch) {
    var $tileParent = $swatch.parents('.product-tile');
    //main Product List Link
    if ($swatch.attr('data-wishlistpid')) {
        module.exports.methods.toggleButtonSelectedState($tileParent, $swatch.attr('data-wishlistpid'));
    }
};

var hijackSwatchClick = function() {
    if (window.isMobile()) {
        $('body').on('click.swatch-link', '.product-tile .swatch-link', module.exports.methods.eventHijackSwatchClick);
    } else {
        $('body').off('click.swatch-link');
    }
};

var toggleButtonSelectedState = function($container, pid) {
    //Make heart icon accurate
    var mainWishlist = $container.find('.wishlist-toggle-product');
    if (mainWishlist.length) {
        mainWishlist.attr('data-wishlistpid', pid);
        //Make heart icon accurate
        wishlistHelpers.updateLinkData(mainWishlist);
    }
};

var toggleProductGuest = function(data) {
    $.ajax({
        url: data.url,
        method: 'POST',
        dataType: 'json',
        data: {
            pid: data.wishlistpid,
            quantity: data.wishlistquantity
        },
        success: function(data) {
            if (!data.error) {
                wishlistHelpers.updateUncachedData({
                    actionType: data.wishlistActionType,
                    pid: data.pid
                });
                wishlistHelpers.updateLinkData(false, data);
                data.guest = true;
                wishlistHelpers.openToast(data);
            } else {
                toastHelpers.methods.show('danger', data.message, true);
            }
        }
    });
};

var eventClickHeart = function(event) {
    event.preventDefault();
    var $this = $(event.currentTarget);
    var wishlistpid = event.currentTarget.dataset.wishlistpid;
    if (window.UncachedData.customer.isAuthenticated) {
        $('#wishlistModalShowLists')
                .data('multiSelect', false)
                .data('pid', wishlistpid)
                .modal('show', $this);
    } else {
        module.exports.methods.toggleProductGuest(event.currentTarget.dataset);
    }
};

var eventMouseEnterSwatch = function() {
    module.exports.methods.swatchChange($(this));
};

var eventAfterAttributeSelect = function(_event, payload) {
    module.exports.methods.toggleButtonSelectedState(payload.container, payload.data.product.wishlistpid);
};

var eventHijackSwatchClick = function(event) {
    event.preventDefault();
    module.exports.methods.swatchChange($(this).find('.swatch'));
};

var addListEventListeners = function() {
    $('body')
        .on('click', '.wishlist-toggle-product', module.exports.methods.eventClickHeart)
        .on('mouseenter', '.product-tile .swatch', module.exports.methods.eventMouseEnterSwatch)
        .on('product:afterAttributeSelect', module.exports.methods.eventAfterAttributeSelect);
    $(window).on('resize',function() {
        module.exports.methods.hijackSwatchClick();
    });
    module.exports.methods.hijackSwatchClick();
    wishlistHelpers.updateLinkData();
}

module.exports = {
    methods: {
        swatchChange: swatchChange,
        hijackSwatchClick: hijackSwatchClick,
        toggleButtonSelectedState: toggleButtonSelectedState,
        toggleProductGuest: toggleProductGuest,
        eventClickHeart: eventClickHeart,
        eventMouseEnterSwatch: eventMouseEnterSwatch,
        eventAfterAttributeSelect: eventAfterAttributeSelect,
        eventHijackSwatchClick: eventHijackSwatchClick
    },
    addListEventListeners: addListEventListeners
};
