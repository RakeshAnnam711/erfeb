'use strict';

function show(type, message, dismissible) {
    var dismissibleClass = dismissible ? 'alert-dismissible' : '';
    var indexClass = 'alert-' + $('.toast-messages .alert').length || 0;
    var closeButton = dismissible ? '<button type="button" class="btn close icon-close" data-dismiss="alert" aria-label="Close"></button>' : '';

    if (!$('.toast-messages').length) {
        $('body').append('<div class="toast-messages"></div>');
    }

    $('.toast-messages').append(
        '<div class="alert alert-' + type + ' ' + indexClass + ' ' + dismissibleClass + '" role="alert">' + message + closeButton + '</div>'
    );

    // Remove non-dismissible alerts from the DOM after 5 seconds
    setTimeout(function() {
        $('.toast-messages').find('.' + indexClass + ':not(.alert-dismissible)').remove();
    }, 5000);
    
}

module.exports = {
    methods: {
        show: show
    },
    bindToastButtonClicks: function() {

        let lastClickedWishlistButton = null;

        // Capture wishlist button clicks and store reference
        $('body').on('click', '.wishlist-toggle-product, [data-toast-trigger]', function(event) {
            lastClickedWishlistButton = this;
        });

        // Handle toast close with data-toast-dismiss="wishlist-toast"
        $('body').on('keydown', '[data-toast-dismiss="wishlist-toast"]', function(event) {
            if (event.keyCode === 13 || event.keyCode === 32) {
                setTimeout(() => {
            if (lastClickedWishlistButton) lastClickedWishlistButton.focus();
        }, 100);
            }
        });        

        $('body').on('click', '[data-toast]', function(event) {
            event.preventDefault();
            var $button = $(event.target);
            var type = $button.data('toast');
            var message = $button.data('content');
            var dismissible = $button.data('dismissible') || false;

            show(type, message, dismissible);
        });
    }
};
