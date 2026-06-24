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
