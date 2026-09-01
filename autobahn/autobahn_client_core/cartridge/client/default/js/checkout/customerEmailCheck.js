'use strict';

const debounce = require('lodash/debounce');
const checkEmailEndpoint = $('#email-guest').attr('data-checkemail');
const $errorContainer = $('.customer-error');
var members = require('integrations/checkout/plugin/members');

let checkedEmails = {};

function emailCheck(scope) {
    const email = scope

    if (email.length >= 6) {
        $.ajax({
            url: checkEmailEndpoint + '?email=' + encodeURIComponent(email),
            method: 'GET',
            success: function (data) {
                if (data.existingCustomer && data.msg) {
                    var errorHtml =
                        '<div class="alert alert-danger alert-dismissible ' +
                        'fade show" role="alert">' +
                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                        '<span aria-hidden="true">&times;</span>' +
                        '</button>' +
                        data.msg +
                        '</div>';

                    $('.js-login-customer').trigger('click');

                    if ($errorContainer.children().length === 0) {
                        setTimeout(function () {
                            $errorContainer.append(errorHtml);
                        }, 200);
                    }
                } else {
                    $errorContainer.children().remove();
                    if (typeof members.nextStage === 'function') {
                        members.nextStage();
                    }
                }
            },
            error: function () {
                $errorContainer.children().remove();
            },
        });
    }
}

module.exports = {
    init: function () {
        $('#email-guest').on('input', function () {
            if ($('#email-guest').val().trim().length >= 6) {
                $('body').trigger('checkout:enableButton', 'button.continue-shipping');
            } else {
                $('body').trigger('checkout:disableButton','button.continue-shipping');
            }
        });

        $('.continue-shipping').on('click', function (e) {
            e.preventDefault();
            const emailVal = $('#email-guest').val().trim()
            emailCheck(emailVal)
        });
    },
};