'use strict';

$(document).ready(() => {
    var $discountStatusBar = $('.discount-status-bar');

    if ($discountStatusBar.length > 0) {
        var url = $discountStatusBar.data('url');
        var dataSelector = '.discount-status-bar-data';

        $('body').on('product:afterAddToCart cart:update', event => {
            $.ajax({
                url: url,
                method: 'GET',
                success: response => {
                    var $response = $('<div>').append($.parseHTML(response));
                    var $data = $response.find(dataSelector).html();
                    $discountStatusBar.find(dataSelector).html($data);
                },
                error: err => {
                    console.error('Unable to update Discount Status Bar: ', err);
                }
            });
        });
    }
});
