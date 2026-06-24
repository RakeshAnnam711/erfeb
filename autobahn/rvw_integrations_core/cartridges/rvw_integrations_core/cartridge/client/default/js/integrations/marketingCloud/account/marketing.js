"use strict";

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for email subscription
 */
 function displayMessage(success, msg) {
    var status = success ? 'alert-success' : 'alert-danger';

    if ($('.email-signup-message').length === 0) {
        $('body').append('<div class="email-signup-message"></div>');
    }

    if (!msg && $('#fallback-fail-msg')) {
        var msg = $('#fallback-fail-msg').data('msg');
    }

    $('.email-signup-message').append('<div class="email-signup-alert text-center alert ' + status + '">' + msg + '</div>');

    setTimeout(function () {
        $('.email-signup-message').remove();
    }, 3000);
}

module.exports = {
    /**
     * Enables user to opt in/opt out of Marketing Cloud email subscriptions in account dashboard
     */
    marketingCloudUpdateSubscription: function() {
        $('body').on('change', '.account-page .mc-form .email-subscription', function (e) {
            var checkbox = $(this);
            checkbox.attr('disabled', true);

            var form = checkbox.closest('form');
            var url = form.data('action');
            if (!url) {
                checkbox.removeAttr('disabled');
                return;
            }

            var subscriberEmail = checkbox.data('subscriber-email');
            var encodedEmail = encodeURIComponent(subscriberEmail); // Handle email with plus signs

            //action: (String Constants) Active|Bounced|Held|Unsubscribed|Deleted
            var urlParams = {
                partnerKey: null,
                objectID: null,
                csrf_token: form.find('[name="csrf_token"]').val(),
                action: checkbox.is(':checked') ? 'Active' : 'Unsubscribed',
                listID: checkbox.data('id'),
                listName: checkbox.data('listName'),
                email: encodedEmail
            };

            var queryString = Object.keys(urlParams).map(key => key + '=' + urlParams[key]).join('&');

            $.ajax({
                url: url + '?' + queryString,
                type: 'post',
                contentType: "application/json",
                dataType: "json",
                data: queryString,
                success: function (data) {
                    displayMessage(data.success, data.msg);
                    checkbox.removeAttr('disabled');

                    if (data.error) {
                        checkbox.prop('checked', false);
                    } else {
                        $('body').trigger('marketingCloudUpdateSubscription:success', data);
                    }
                }
            });
        });
    },
    marketingCloudUnsubscribeAll: function() {
        $('body').on('change', '.account-page #opt_out_all', function (e) {
            if ($(this).is(':checked')) {
                $('.account-page .mc-form .email-subscription').each(function() {
                    var checkbox = $(this);
                    if (checkbox.is(':checked')) {
                        checkbox.prop('checked', false).change();
                    }
                });
            }
        });
    },
    handleUpdateEmailButton: function() {
        $('body').on('keyup change', '.account-page .mc-email-input', function (e) {
            $('.account-page .mc-update-email-button').removeClass('d-none');
        });
    }
}
