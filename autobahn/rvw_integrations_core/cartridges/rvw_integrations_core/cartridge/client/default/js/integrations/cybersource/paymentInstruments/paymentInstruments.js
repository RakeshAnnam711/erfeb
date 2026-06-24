'use strict';

var formValidation = require('base/components/formValidation');

var cleave = require('../components/cleave');
var recaptcha = require('core/components/recaptcha');
var scrollAnimate = require('core/components/scrollAnimate');
var url;

function removePayment() {
    $('.remove-payment').on('click', function (e) {
        e.preventDefault();
        url = $(this).data('url') + '?UUID=' + $(this).data('id');
        $('.payment-to-remove').empty().append($(this).data('card'));

        $('.delete-confirmation-btn').off('click').on('click', function (f) {
            f.preventDefault();
            $('.remove-payment').trigger('payment:remove', f);
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('#uuid-' + data.UUID).remove();
                    if (data.message) {
                        var toInsert = '<div><h3>'
                            + data.message
                            + '</h3><div>';
                        $('.paymentInstruments').html(toInsert);
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $.spinner().stop();
                }
            });
        });
    });
}

function submitPayment() {
    $('form.payment-form').on('submit', function (e) {
        var $form = $(this);
        e.preventDefault();
        url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);

        var formData = cleave.serializeData($form);

        recaptcha.check(e, {
            url: url,
            type: 'post',
            dataType: 'json',
            data: formData,
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    formValidation($form, data);
                    if (data.message) {
                        var toInsert = '<div><h3 class="alert-danger">'
                            + data.message
                            + '</h3><div>';
                        $('.paymentInstruments').html(toInsert);
                        scrollAnimate($('body'));
                    }
                } else {
                    // eslint-disable-next-line
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    });
}

module.exports = {
    removePayment: removePayment,
    submitPayment: submitPayment
};
