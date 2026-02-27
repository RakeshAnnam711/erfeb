"use strict";

/**
 * Enables user to opt in to klaviyo email subscriptions in checkout
 */
module.exports = {
    klaviyoSubscriptionQuery: function() {
        $('body').on('checkout:beforePlaceOrder', function (e, button) {

            //
            // Append Klaviyo subscription checkbox as querystring to placeOrder action
            //
            var form = $('[name="klaviyoSubscribe"]');
            var subscribe = form.find('#KLEmailSubscribe');
            var email = subscribe.val();
            var encodedEmail = encodeURIComponent(email);
            // var params = '?filter=equals(email,%22' + encodedEmail + '%22)';
            var isChecked = subscribe.is(':checked');

            var data = {
                email: encodedEmail,
                marketingOptIn: isChecked ? true : false,
                unsubscribe: false
            };
            var queryString = Object.keys(data).map(key => key + '=' + data[key]).join('&');
            var button = $(button);

            if (isChecked && email != null) {
                button.data('action', button.data('action') + '?' + queryString);
            }
        });
    },
    klaviyoSubscriptionPush: function () {
        $('body').on('checkout:afterPlaceOrder', function (e, data) {
            if (!data.error) {
                $('body').trigger('klaviyoSubscribe:success', data);
            }
        });
    }
}