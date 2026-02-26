'use strict';

function checkoutPlugin() {
    var members = require('./plugin/members');

    (function ($) {
        $.fn.checkout = function () { // eslint-disable-line
            //
            // Initialize the checkout
            //
            members.initialize(this);

            return this;
        };
    }(jQuery));

    $('#checkout-main').checkout();
}

module.exports = {
    checkoutPlugin: checkoutPlugin
};
