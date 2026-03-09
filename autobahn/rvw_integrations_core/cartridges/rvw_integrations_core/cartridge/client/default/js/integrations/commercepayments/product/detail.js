'use strict';

module.exports = {
    sfcpUpdateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            $('body').trigger('PaymentMethodObserver:Show', { name: 'available', show: !response.product.readyToOrder || !response.product.available })
        });
    },
};
