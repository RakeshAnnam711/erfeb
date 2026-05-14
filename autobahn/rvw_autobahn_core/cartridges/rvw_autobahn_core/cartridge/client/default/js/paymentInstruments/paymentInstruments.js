'use strict';

var formValidation = require('base/components/formValidation');
var cleave = require('base/components/cleave');
var base = require('base/paymentInstruments/paymentInstruments');
var recaptcha = require('../components/recaptcha');
var url;

module.exports = {
    submitPayment: function () {
        $('form.payment-form').submit(function (e) {
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
                    } else {
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
    },
}

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
