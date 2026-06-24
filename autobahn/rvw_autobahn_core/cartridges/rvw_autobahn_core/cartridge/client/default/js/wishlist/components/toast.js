'use strict';

var wishlistHelpers = require('core/wishlist/components/helpers');
const toastRecycleTime = 500;

var dismiss = function($toast) {
    $toast
        .removeClass('show')
        .attr('tabindex', '-1');
    module.exports.methods.removeEventListenersWindow();
};

var show = function($toast) {
    $toast
        .addClass('show')
        .attr('tabindex', '0')
        .trigger('focus');
    module.exports.methods.addEventListenersWindow();
};

var eventClickUndo = function(e) {
    e.preventDefault();
    var $this = $(this);
    var $toast = $this.parents('.wishlist-toast');
    var url;
    var wishlistId;
    var wishlistQuantities;
    var productOptions;

    if (typeof $toast.data().wishlistId === 'string') {
        url = $this.data().urlList;
        wishlistId = $toast.data().wishlistId;
        wishlistQuantities = $toast.data().wishlistQuantities;
        productOptions = $toast.data().productOptions;
    } else {
        url = $this.data().urlLists;
        wishlistId = $toast.data().wishlistId.join('|');
        wishlistQuantities = $toast.data().wishlistQuantities.join('|');
        productOptions = $toast.data().productOptions;
    }

    $.ajax({
        url: url,
        method: 'POST',
        dataType: 'json',
        data: {
            pid: $toast.data().productId,
            wishlistId: wishlistId,
            wishlistQuantities: wishlistQuantities,
            productOptions: productOptions
        },
        success: function(data) {
            if (!data.error) {
                wishlistHelpers.updateUncachedData({
                    actionType: data.wishlistActionType,
                    pid: data.pid
                });
                wishlistHelpers.updateLinkData();
                wishlistHelpers.openToast(data);
            } else {
                toastHelpers.methods.show('danger', data.message, true);
            }
        }
    });
};

var eventClickWindow = function(e) {
    if (!$(e.target).is('[data-toast-trigger]')) {
        module.exports.methods.dismiss($('.wishlist-toast'));
    }
};

var eventKeyPressEscapeWindow = function (e) {
    if (e.key && e.key === 'Escape') {
        module.exports.methods.dismiss($('.wishlist-toast'));
    }
};

var eventStopPropagation = function(e) {
    e.stopPropagation();
};

var eventDismissButton = function(e) {
    e.preventDefault();
    module.exports.methods.dismiss($(this).parents('.wishlist-toast'));
}

var eventShow = function(e, callback) {
    e.preventDefault();
    var $toast = $(this);
    if ($toast.hasClass('show')) {
        module.exports.methods.dismiss($toast);
        setTimeout(() => {
            if (callback) {
                callback($toast, 33);
            }
            module.exports.methods.show($toast);
        }, toastRecycleTime);
    } else {
        if (callback) {
            callback($toast);
        }
        module.exports.methods.show($toast);
    }
};

var eventDismiss = function(e, callback) {
    e.preventDefault();
    var $toast = $(this);
    module.exports.methods.dismiss($toast);
    if (callback) {
        callback($toast);
    }
};

var addEventListenersToast = function() {
    $('.wishlist-toast')
        .on('click', module.exports.methods.eventStopPropagation)
        .on('click', '.undo', module.exports.methods.eventClickUndo)
        .on('click', '[data-toast-dismiss]', module.exports.methods.eventDismissButton)
        .on('show', module.exports.methods.eventShow)
        .on('dismiss', module.exports.methods.eventDismiss);
};

var addEventListenersWindow = function() {
    $(window)
        .on('keydown', module.exports.methods.eventKeyPressEscapeWindow)
        .on('click', module.exports.methods.eventClickWindow);

};

var removeEventListenersWindow = function() {
    $(window)
        .off('keydown', module.exports.methods.eventKeyPressEscapeWindow)
        .off('click', module.exports.methods.eventClickWindow);
};

module.exports = {
    methods: {
        dismiss: dismiss,
        show: show,
        eventClickUndo: eventClickUndo,
        eventClickWindow: eventClickWindow,
        eventKeyPressEscapeWindow: eventKeyPressEscapeWindow,
        eventStopPropagation: eventStopPropagation,
        eventDismissButton: eventDismissButton,
        eventShow: eventShow,
        eventDismiss: eventDismiss,
        addEventListenersWindow: addEventListenersWindow,
        removeEventListenersWindow: removeEventListenersWindow
    },
    addEventListenersToast: addEventListenersToast
}
