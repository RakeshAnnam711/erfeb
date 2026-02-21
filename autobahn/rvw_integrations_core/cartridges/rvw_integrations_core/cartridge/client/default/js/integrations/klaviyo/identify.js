"use strict";

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for email sign-up
 */
 function displayMessage(success, msg) {
    var status = success ? 'alert-success' : 'alert-danger';

    if ($('.email-signup-message').length === 0) {
        $('body').append('<div class="email-signup-message"></div>');
    }

    if (!msg && $('#fallback-fail-msg')) {
        var msg = $('#fallback-fail-msg').val();
    }

    $('.email-signup-message').append('<div class="email-signup-alert text-center alert ' + status + '">' + msg + '</div>');

    setTimeout(function () {
        $('.email-signup-message').remove();
    }, 3000);
}

module.exports = {
    klaviyoPush: function() {
        $('body').on('login:register:success footer:signup:success subscribe:success klaviyoSubscribe:success klaviyoUpdateSubscription:success', function (e, data) {
            if (data.klaviyo) { // klaviyo integration — identifies user
                klaviyo.push([ 'identify', data.klaviyo]);
            }
        });
    },

    /**
     * Enables user to opt in/opt out of klaviyo email subscriptions in account dashboard
     */
    klaviyoUpdateSubscription: function() {
        $('body').on('change', '.account-page .klaviyo-form .klaviyo-subscription', function (e) {

            //
            // Submit the Klaviyo Subscribe Form
            //
            var form = $('[name="klaviyoSubscribe"]');
            var subscribe = form.find('#klaviyo-subscription-checkbox');
            var csrf_token = form.find('[name="csrf_token"]').val();
            var email = subscribe.val();
            var isChecked = subscribe.is(':checked');

            var data = {
                email: email,
                marketingOptIn: isChecked ? true : false,
                unsubscribe: isChecked ? false : true,
                csrf_token: csrf_token
            }
            var queryString = Object.keys(data).map(key => key + '=' + data[key]).join('&');

            if (email != null) {
                $.ajax({
                    url: form.attr('action') + '?' + queryString,
                    type: 'post',
                    data: queryString,
                    contentType: "application/json",
                    dataType: "json",
                    success: function (data) {
                        // push the checkbox data
                        $('body').trigger('klaviyoUpdateSubscription:success', data);
                        displayMessage(data.success, data.msg);
                    }
                });
            }
        });
    }
}
