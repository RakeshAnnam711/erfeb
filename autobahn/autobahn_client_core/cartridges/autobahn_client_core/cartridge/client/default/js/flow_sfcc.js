/* global $:false, flow:false */
$(document).ready(function () {
    $('body').on('product:afterAddToCart', function (ev, data) {
        var uuid;
        var item;

        if (!data) {
            return;
        }

        uuid = data.pliUUID;
        item = data.cart.items.filter(function (el) {
            if (el.UUID === uuid) {
                return el;
            }
            return null;
        });

        item = item.length ? item[0] : null;

        if (item && item.price && item.price.sales) {
            flow.beacon.processEvent('cart_add', {
                item_number: item.id,
                quantity: item.quantity,
                price: {
                    amount: item.price.sales.decimalPrice,
                    currency: item.price.sales.currency
                }
            });
        }
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function () {
        var pid = $(this).data('pid');

        flow.beacon.processEvent('cart_remove', {
            item_number: pid
        });
    });
});
