/* global Promise */
'use strict';

/**
 * Get the cart quantity.
 * @param {string} url - URL of the controller to get the cart model
 * @param {number=} delay - milliseconds to wait before getting the cart (default is 1000)
 * @returns {Promise} - promise to resolve the cart model and its quantity
 */
function getCartQuantity(url, delay) {
    return new Promise(function (resolve, reject) {
        // Default delay to 1 second
        var timeoutMillis = delay || 1000;

        setTimeout(function () {
            $.ajax({
                url: url,
                contentType: 'application/json; charset=UTF-8',
                success: function (response) {
                    if (response.quantityTotal) {
                        // Resolve response for mini cart update
                        resolve(response);
                    } else {
                        // Get the cart again after a longer delay
                        getCartQuantity(url, timeoutMillis * 2).then(resolve, reject);
                    }
                },
                error: reject
            });
        }, timeoutMillis);
    });
}

module.exports = {
    updateBuyNowRequest: function () {
        if (window.sfpp) {
            sfpp.ready(function () {   // eslint-disable-line
                var errorElement = $(document.querySelector('.salesforce-buynow-element-errors'));
                var buynow = sfpp.get('buynow');   // eslint-disable-line

                var getCartUrl = $('.salesforce-buynow-element').data('getcart');
                var placeOrderUrl = $('.salesforce-buynow-element').data('placeorder');

                $('body').on('product:updateAddToCart', function (e, response) {
                    buynow.updateBasketData(response.product.buynow.basketData);
                    buynow.updatePaymentRequest(response.product.buynow.options);
                });

                // Update mini cart count once basket is prepared
                buynow.on('click', function () {
                    getCartQuantity(getCartUrl).then(function (response) {
                        $('.minicart').trigger('count:update', response);
                        $('body').trigger('product:afterAddToCart', response);
                    });
                });

                // Update error message on change
                buynow.on('change', function (event) {
                    if (event.error) {
                        // Inform the customer that there is an error.
                        errorElement.empty().text(event.error.message);
                    } else {
                        // Clear out error message
                        errorElement.empty();
                    }
                });

                buynow.on('payment', function () {
                    $.ajax({
                        url: placeOrderUrl,
                        method: 'POST',
                        contentType: 'application/json; charset=UTF-8',
                        success: function (data) {
                            if (data.error) {
                                // Inform the customer that there is an error.
                                errorElement.empty().text(data.errorMessage);
                            } else {
                                // Show the order confirmation page
                                var redirect = $('<form>')
                                    .appendTo(document.body)
                                    .attr({
                                        method: 'POST',
                                        action: data.continueUrl
                                    });

                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderID',
                                        value: data.orderID
                                    });

                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderToken',
                                        value: data.orderToken
                                    });

                                redirect.submit();
                            }
                        },
                        error: function (err) {
                            // Inform the customer that there is an error.
                            errorElement.empty().text(err.message);
                        }
                    });
                });
            });
        }
    }
};
