'use strict';
var baseLoginLogin = require('base/login/login');

var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');
var recaptcha = require('../components/recaptcha');


baseLoginLogin.login = function () {
    $('form.login').submit(function (e) {
        var form = this;
        var $form = $(form);
        var timeout = $form.data('timeout') || 6000; //default timeout (increased on retry)
        var defer = $form.data('defer');

        e.preventDefault();

        // Cancel Ajax
        if ($form.hasClass('csrf-used')) return false;

        // Stop recaptcha promise chain and prevent AJAX
        defer?.state?.() !== 'resolved' && defer?.reject();

        // retry only allow if recaptcha failed as CSRF token will be invalidated
        $form.data('defer', recaptcha.check(e, {
            url: $form.attr('action'),
            type: 'post',
            dataType: 'json',
            data: $form.serialize(),
            timeout: timeout,
            beforeSend: function ($xhr, settings) {
                $form.addClass('csrf-used');
                $form.data('timeout', timeout * 1.5);
                $.spinner().start();
            },
            success: function (data) {
                if (data?.success !== true) {
                    formValidation(form, data);
                    $form.trigger('login:error', data);
                    $.spinner().stop();
                    $form.removeClass('csrf-used');
                } else {
                    var isLoginFromPDP = $form.find('input[type="hidden"][name="isLoginFromPDP"]').val()
                    if(isLoginFromPDP && isLoginFromPDP.trim().toLowerCase() != 'null'){
                        if (Array.isArray(data.__gtmEvents)) {
                            window.parent.dataLayer = window.parent.dataLayer || [];
                            data.__gtmEvents.forEach(event => {
                                window.parent.dataLayer.push(event);
                            });
                        }
                        window.parent.postMessage({ action: 'userLoggedInFromPDP' }, '*');
                        return;
                    }
                    $form.trigger('login:success', data);
                    location.href = data.redirectUrl;
                }
            },
            error: function (data) {
                if (data?.responseJSON?.redirectUrl) {
                    location.href = data.responseJSON.redirectUrl;
                } else {
                    $form.trigger('login:error', data);
                    $.spinner().stop();
                    $form.removeClass('csrf-used');
                }
            }
        }));
        // Move to after Ajax initialization, still triggered if an AJAX request was started but not if ajax call is malformed
        $form.trigger('login:submit', e);
    });
};

baseLoginLogin.register = function () {
    $('form.registration').submit(function (e) {
        var form = this;
        var $form = $(form);
        var timeout = $form.data('timeout') || 6000; //default timeout (increased on retry)
        var defer = $form.data('defer');

        e.preventDefault();

        // Cancel Ajax
        if ($form.hasClass('csrf-used')) return false;

        // Stop recaptcha promise chain and prevent AJAX
        defer?.state?.() !== 'resolved' && defer?.reject();

        $form.data('defer', recaptcha.check(e, {
            url: $form.attr('action'),
            type: 'post',
            dataType: 'json',
            data: $form.serialize(),
            timeout: timeout,
            beforeSend: function ($xhr, settings) {
                $form.addClass('csrf-used');
                $form.data('timeout', timeout * 1.5);
                // $form.spinner().start();
                $.spinner().start();
            },
            success: function (data) {
                if (data?.success !== true) {
                    $form.trigger('login:register:error', data);
                    formValidation(form, data);
                    // $form.spinner().stop();
                    $.spinner().stop();
                    $form.removeClass('csrf-used');
                } else {
                    var isLoginFromPDP = $form.find('input[type="hidden"][name="isLoginFromPDP"]').val()
                    if(isLoginFromPDP && isLoginFromPDP.trim().toLowerCase() != 'null'){
                        if (Array.isArray(data.__gtmEvents)) {
                            window.parent.dataLayer = window.parent.dataLayer || [];
                            data.__gtmEvents.forEach(event => {
                                window.parent.dataLayer.push(event);
                            });
                        }
                        window.parent.postMessage({ action: 'userLoggedInFromPDP' }, '*');
                        return;
                    }
                    $form.trigger('login:register:success', data);
                   // Push data to window.dataLayer
                   window.dataLayer = window.dataLayer || [];
                   var registrationEventPayload = {
                       event: "account_created",
                       properties: {
                           account_id: window.Customer?.customerNo || data.customerNo || data.email,
                           account_created_timestamp: Date.now().toString(),
                           account_status: "active",
                           account_creation_method: "email_signup",
                           email: data.email || "",
                           phone: data.phone || "",
                           first_name: data.firstName || " ",
                           last_name: data.lastName || "",
                       }
                   };
                   window.dataLayer.push(registrationEventPayload);
                   console.log("Account created event pushed to dataLayer");
                   location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err?.responseJSON?.redirectUrl) {
                    location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification($('.error-messaging'), err?.responseJSON?.errorMessage);
                    $form.trigger('login:register:error', err);
                    // $form.spinner().stop();
                    $.spinner().stop();
                    $form.removeClass('csrf-used');
                }
            }
        }));

        // Move to after Ajax initialization, still triggered if an AJAX request was started but not if ajax call is malformed
        $form.trigger('login:register', e);
    });
};

baseLoginLogin.resetPassword = function () {
    $('.reset-password-form').submit(function (e) {
        var form = this;
        var $form = $(form);
        var timeout = $form.data('timeout') || 6000; //default timeout (increased on retry)
        var defer = $form.data('defer');
        e.preventDefault();

        // Cancel Ajax
        if ($form.hasClass('csrf-used')) return false;

        // Stop recaptcha promise chain and prevent AJAX
        defer?.state?.() !== 'resolved' && defer?.reject();

        $form.data('defer', recaptcha.check(e, {
            url: $form.attr('action'),
            type: 'post',
            dataType: 'json',
            data: $form.serialize(),
            timeout: timeout,
            beforeSend: function ($xhr, settings) {
                $form.addClass('csrf-used');
                $form.data('timeout', timeout * 1.5);
                $form.spinner().start();
            },
            success: function (data) {
                if (data?.success !== true) {
                    formValidation(form, data);
                } else {
                    $('.request-password-title').text(data.receivedMsgHeading);
                    $('.request-password-body').empty()
                        .append('<p cypress-target="reset-password-submit-confirmation">' + data.receivedMsgBody + '</p>');
                    if (!data.mobile) {
                        $('#submitEmailButton').text(data.buttonText).attr('data-dismiss', 'modal');
                        if($form.find('input[type="hidden"][name="isLoginFromPDP"]').val().trim().toLowerCase() != 'null'){
                            $('#submitEmailButton').addClass('d-none');
                        }
                    } else {
                        $('.send-email-btn').empty()
                            .html('<a href="'
                                + data.returnUrl
                                + '" class="btn btn-primary btn-block">'
                                + data.buttonText + '</a>'
                            );
                    }
                        }
                $form.spinner().stop();
                $form.removeClass('csrf-used');

            },
            error: function (err) {
                if (err?.responseJSON?.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    $form.spinner().stop();
                    $form.removeClass('csrf-used');
                }
            }
        }));

        // Move to after Ajax initialization, still triggered if an AJAX request was started but not if ajax call is malformed
        $form.trigger('login:register', e);
    });
};

module.exports = baseLoginLogin;
