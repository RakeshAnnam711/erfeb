'use strict';

$(document).ready(function() {
    $('body').on('click', '#fa-link', function () {
        event.preventDefault();
        var $temp = $('<input>');
        $('body').append($temp);
        $temp.val($('#shareUrl').val()).select();
        document.execCommand('copy');
        $temp.remove();
        $('.copy-link-message').attr('role', 'alert');
        $('.copy-link-message').removeClass('d-none');
        setTimeout(function () {
            $('.copy-link-message').addClass('d-none');
        }, 3000);
    });
});
