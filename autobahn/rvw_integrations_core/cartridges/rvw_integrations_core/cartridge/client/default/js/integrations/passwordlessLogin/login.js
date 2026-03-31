'use strict';

const formValidation = require('base/components/formValidation');
var $tokenCodeInputs = $('input[name^="tokenDigit-"]');
var isTokenFormSubmitting = false;

/**
 * update modal contents after ajax call
 * @param {Object} data - response object
 */
const updateModalContents = (data) => {
    $('.request-passwordless-login-title').text(data.receivedMsgHeading || '');
    $('.request-passwordless-login-body').empty().append(data.receivedMsgBody || '');

    if (data.buttonText && data.redirectUrl) {
        if (data.showTokenForm) {
            $('.passwordless-form')
                .off('submit')
                .removeClass('passwordless-form')
                .addClass('passwordless-token-form')
                .attr('action', data.redirectUrl);
            if (data.usid) {
                $('.passwordless-token-form').data('usid', data.usid);
            }
            $('.send-passwordless-email-btn')
                .empty()
                .html(
                    `<button type="submit" id="submitTokenButton"
                        class="btn btn-primary btn-block">
                    ${data.buttonText}</button>`);
            $tokenCodeInputs = $('input[name^="tokenDigit-"]');
            module.exports.digitsOnly();
            module.exports.autoAdvanceToken();
            module.exports.moveFocusOnClear();
            module.exports.handlePasteEvent();
            module.exports.submitPwdlessTokenForm();
        } else {
            $('.send-passwordless-email-btn')
                .empty()
                .html(
                    `<a href="${data.redirectUrl}" class="btn btn-primary btn-block">
                ${data.buttonText}
            </a>`);
        }
    } else {
        $('.send-passwordless-email-btn').empty().html('');
    }
};

const getTokenValue = function () {
    var token = '';
    $tokenCodeInputs.each(function () {
        token += $(this).val();
    });
    return token;
};

const submitTokenFormPreValidate = function (){
    var token = getTokenValue();
    return token.length === 8;
};

module.exports = {
    submitPwdlessForm: function () {
        $('.passwordless-form').submit(function (e) {
            var form = $(this);
            e.preventDefault();
            form.spinner().start();
            $.ajax({
                url: form.attr('action'),
                type: 'post',
                dataType: 'json',
                data: form.serialize() + '&source=form',
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                    } else {
                        updateModalContents(data);
                    }
                },
                error: function () {
                    form.spinner().stop();
                }
            });
            return false;
        });
    },

    selectPwdlessLogin: function () {
        $(document).on('click', '.btn-pwdless-select-login', function (e) {
            e.preventDefault();
            var form = $('.passwordless-form');
            $('.alert', form).remove();
            $.spinner().start();
            $.ajax({
                url: $(this).attr('href'),
                type: 'post',
                dataType: 'json',
                data: {
                    login: $(this).data('login'),
                    csrf_token: $('input[name="csrf_token"]', form).val(),
                    source: 'select-modal'
                },
                success: function (data) {
                    $.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                    } else {
                        updateModalContents(data);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
            return false;
        });
    },

    submitPwdlessTokenForm: function () {
        $('.passwordless-token-form').submit(function (e) {
            e.preventDefault();
            if (!submitTokenFormPreValidate()) {
                return false;
            }
            if (isTokenFormSubmitting) {
                return false;
            }
            isTokenFormSubmitting = true;

            var form = $(this);
            const token = getTokenValue();
            form.spinner().start();
            $.ajax({
                url: form.attr('action'),
                type: 'post',
                dataType: 'json',
                data: {
                    source: 'ajax',
                    token: token,
                    usid: form.data('usid'),
                    rurl: $('.pwdless-data-container').data('reentry-endpoint')
                },
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        formValidation(form, data);
                        isTokenFormSubmitting = false;
                    }
                    if (data.success && data.redirectUrl) {
                        isTokenFormSubmitting = true;
                        window.location.href = data.redirectUrl;
                    } else {
                        isTokenFormSubmitting = false;
                    }
                },
                error: function () {
                    form.spinner().stop();
                    isTokenFormSubmitting = false;
                }
            });
            return false;
        });
    },

    // Only allow digits to be entered
    digitsOnly: function () {
        $tokenCodeInputs.on('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    },

    autoAdvanceToken: function () {
        $tokenCodeInputs.on('keyup', function (e) {
            if (this.value.length >= 1) {
                var nextInput = $(this).closest('div').next().find('input');
                if (nextInput.length) {
                    nextInput.focus();
                } else {
                    if (submitTokenFormPreValidate()) {
                        $('.passwordless-token-form').submit();
                    }
                }
            }
        });
    },

    moveFocusOnClear: function () {
        $tokenCodeInputs.on('keydown', function (e) {
            var isShiftTab = e.shiftKey && e.keyCode === 9
            if ((isShiftTab || e.keyCode === 8) && this.value.length === 0) {
                var prevInput = $(this).closest('div').prev().find('input');
                if (prevInput.length) {
                    prevInput.value = '';
                    prevInput.val('');
                    prevInput.focus();

                    if (isShiftTab) {
                        e.preventDefault();
                    }
                }
            }
        });
        $tokenCodeInputs.on('mousedown', function (e) {
            if (this.value.length > 0) {
                this.value = '';
                $(this).val('');
            }
        });
    },

    handlePasteEvent: function () {
        $tokenCodeInputs.on('paste', function (e) {
            var pastedData = e.originalEvent.clipboardData.getData('text');
            if (pastedData.length === $tokenCodeInputs.length) {
                var lastFilledInput = null;
                $tokenCodeInputs.each(function (index, input) {
                    $(input).val(pastedData.charAt(index));
                    if ($(input).val() !== '') {
                        lastFilledInput = input;
                    }
                });
                // Set focus on the last filled input
                if (lastFilledInput) {
                    $(lastFilledInput).focus();
                }
            }
        });
    }
};
