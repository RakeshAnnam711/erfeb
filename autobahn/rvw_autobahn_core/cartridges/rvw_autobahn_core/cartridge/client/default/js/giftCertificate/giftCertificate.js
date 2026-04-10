
'use strict';

var formErrors = require('../checkout/formErrors');
var formValidation = require('base/components/formValidation');
var cart = require('../cart/cart');
var recaptcha = require('../components/recaptcha');


function giftCertificateCodePillHtml(data) {
const removeGiftCertificateUrl = data.removeGiftCertificateUrl;
const paymentInstruments = data.order.billing.payment.selectedPaymentInstruments
return ( 
    paymentInstruments.map((paymentInstrument) => (
        `<div class="giftCertificate-pill valid">
            <div class="d-inline-flex giftCertificate-code">${paymentInstrument.maskedGiftCertificateCode}</div>
            <button type="button" class="js-remove-giftcertificate-pi" data-action="${removeGiftCertificateUrl}" data-giftcertificatecode="${paymentInstrument.giftCertificateCode}">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>`
    ))
)};

/**
 * shows giftcert toast message
 * @param {string} data - data returned from the server's ajax call
 */
function displayMessage(data, button) {
    $.spinner().stop();

    $('.minicart').trigger('count:update', data);
    var status = data.success ? 'alert-success' : 'alert-danger';

    if ($('.add-giftcertificate-messages').length === 0) {
        $('body').append('<div class="add-giftcertificate-messages toast-messages"></div>');
    }

    $('.add-giftcertificate-messages').append('<div class="alert text-center add-giftcertificate-alert text-center ' + status + '">' + (data.msg || 'There was an error') + '</div>');

    setTimeout(function () {
        $('.add-giftcertificate-messages').remove();
        if (button) {
            button.removeAttr('disabled');
        }
    }, 5000);
}

function giftCertificateFormSubmission() {
    $('body').on('submit', 'form.GiftCertificateForm', function (e) {
        e.preventDefault();

        var form = $(this);
        var isEdit = false;
        var button = form.find('.btn-add-giftcertificate-tocart');
        if (!button || !button.length) {
            button = form.find('.btn-update-giftcertificate-incart');
            isEdit = true;
        } else {
            $('body').trigger('product:beforeAddToCart', this);
        }
        form.parents('.card').spinner().start();

        var url = form.attr('action');
        var queryString = form.serialize() + '&format=ajax';
        if (isEdit) {
            queryString += '&uuid=' + button.data('uuid');
        }
        button.attr('disabled', true);
        recaptcha.check(e, {
            url: url,
            method: 'POST',
            dataType: 'json',
            data: queryString,
            success: function (data) {
                if (data.success) {
                    if (isEdit) {
                        $('#editGiftCertificateLineItemModal').modal('hide');
                        cart.updateCartTotals(data.cartModel);
                        updateGiftCertificateLineItem(data.cartModel, button.data('uuid'));
                        $('body').trigger('cart:update', [data, button.data('uuid')]);
                    } else {
                        $('body').trigger('product:afterAddToCart', data);
                    }
                    form.trigger('reset');
                    formErrors.clearPreviousErrors(form);
                } else {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        formValidation(form, data);
                    }
                }

                displayMessage(data, button);
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                displayMessage(err, button);
            }
        });
    })
};

function updateGiftCertificateLineItem(data, uuid) {
    var lineItem;
    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    if (lineItem) {
        $('.dwfrm_giftCertificate_purchase_from-' + uuid + ' span').html(lineItem.senderName);
        $('.dwfrm_giftCertificate_purchase_from-' + uuid).data('value', lineItem.senderName);
        $('.dwfrm_giftCertificate_purchase_recipient-' + uuid + ' span').html(lineItem.recipientName);
        $('.dwfrm_giftCertificate_purchase_recipient-' + uuid).data('value', lineItem.recipientName);
        $('.dwfrm_giftCertificate_purchase_recipientEmail-' + uuid + ' span').html(lineItem.recipientEmail);
        $('.dwfrm_giftCertificate_purchase_recipientEmail-' + uuid).data('value', lineItem.recipientEmail);
        $('.dwfrm_giftCertificate_purchase_message-' + uuid + ' span').html(lineItem.message || '');
        $('.dwfrm_giftCertificate_purchase_message-' + uuid).attr('title', lineItem.message || '');
        $('.pricing.item-total-' + uuid).html(lineItem.priceTotal.price);
        $('.pricing.item-total-' + uuid).data('value', lineItem.priceTotal.priceValue + '');
    }
}

function checkBalanceFormSubmission() {
    $('body').on('submit', 'form.check-balance', function (e) {
        e.preventDefault();

        var form = $(this);
        form.spinner().start();

        var button = form.find('.js-checkbalancebutton');
        var url = form.attr('action');
        var queryString = form.serialize() + '&format=ajax';
        button.attr('disabled', true);

        //because the error is not an html5 error typically (balance is 0 or does not exist)
        //we must clear the previous error + message manually
        formErrors.clearPreviousErrors(form);
        recaptcha.check(e, {
            url: url,
            method: 'POST',
            dataType: 'json',
            data: queryString,
            success: function (data) {
                if (data.success) {
                    form.find('.balancemsg').html(data.balance);
                } else {
                    form.find('.balancemsg').html('');
                    formValidation(form, data);
                    if (data.msg) {
                        displayMessage(data, button);
                    }
                }

                $.spinner().stop();
                button.removeAttr('disabled');
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                displayMessage(err, button);
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', function () {

    var giftInput = document.getElementById('giftcertificateid');
    var clearBtn = document.querySelector('.clear_giftcertificate_input');
    var applyBtn = document.querySelector('.js-applybalancebutton');

    var restrictionMessage = document.getElementById('giftcard-payment-restriction-message');
    var giftInputDisabledMessage = document.getElementById('giftcard-input-disabled-message');

    let userInteracted = false;

    function updateState() {

        var isApplied = document.querySelector('.gift_certificates_list');
        var hasInput = giftInput && giftInput.value.trim().length > 0;

        var selectedPayment = document.querySelector('input[name="brandCode"]:checked');
        var selectedBrand = selectedPayment ? selectedPayment.value : null;

        var isCreditCard =
            selectedBrand === 'scheme' ||
            (selectedBrand && selectedBrand.indexOf('storedCard') === 0);

        // -------------------------------
        // CASE 1: Gift card applied or entered
        // -------------------------------
        if (isApplied || hasInput) {

            disableOtherPaymentMethods(true);
            enableGiftCardSection(true);

            if (restrictionMessage) restrictionMessage.style.display = 'block';
            if (giftInputDisabledMessage) giftInputDisabledMessage.style.display = 'none';

            return;
        }

        // -------------------------------
        // CASE 2: Non-credit-card selected
        // -------------------------------
        if (selectedPayment && !isCreditCard) {

            enableGiftCardSection(false);
            disableOtherPaymentMethods(false);

            if (giftInputDisabledMessage) giftInputDisabledMessage.style.display = 'block';
            if (restrictionMessage) restrictionMessage.style.display = 'none';

            return;
        }

        // -------------------------------
        // CASE 3: Credit card selected or nothing selected
        // -------------------------------
        enableGiftCardSection(true);
        disableOtherPaymentMethods(false);

        if (restrictionMessage) restrictionMessage.style.display = 'none';
        if (giftInputDisabledMessage) giftInputDisabledMessage.style.display = 'none';
    }

    function disableOtherPaymentMethods(disable) {

        var paymentMethods =
            document.querySelectorAll('#paymentMethodsList li.paymentMethod');
    
            paymentMethods.forEach(function (method) {
    
            var radio = method.querySelector('input[name="brandCode"]');
            if (!radio) return;
    
            var brandCode = radio.value;
    
            var isCreditCard = 
            brandCode === 'scheme' || 
            brandCode?.startsWith('storedCard');
    
            if (!isCreditCard) {
    
                radio.disabled = disable;
    
                if (disable) {
                    method.style.opacity = '0.5';
                    if (radio.checked) {
                        radio.checked = false;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
    
                } else {
                    method.style.opacity = '';
                    radio.disabled = false; 
                }
            }
        });
    
        // Auto select stored card first, else credit card
        var selectedPayment = document.querySelector('input[name="brandCode"]:checked');

        if (disable && !selectedPayment) {
        
            var storedCard = document.querySelector('input[name="brandCode"][value^="storedCard"]');
        
            if (storedCard) {
                storedCard.checked = true;
                storedCard.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }
        
            var creditCard = document.getElementById('rb_scheme');
        
            if (creditCard) {
                creditCard.checked = true;
                creditCard.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
    
    function enableGiftCardSection(enable) {

        var giftApplyBtn = document.querySelector('.gift-apply-btn');

        if (giftInput) {
            giftInput.disabled = !enable;
            giftInput.style.opacity = enable ? '' : '0.6';
            if (!enable) giftInput.value = '';
        }

        if (applyBtn) {
            applyBtn.disabled = !enable;
            applyBtn.style.pointerEvents = enable ? '' : 'none';
            applyBtn.style.opacity = enable ? '' : '0.6';
        }

        if (giftApplyBtn) {
            giftApplyBtn.disabled = !enable;
            giftApplyBtn.style.pointerEvents = enable ? '' : 'none';
            giftApplyBtn.style.opacity = enable ? '' : '0.6';
        }
    }

    // -------------------------------
    // Event Listeners
    // -------------------------------

    if (giftInput) {
        giftInput.addEventListener('input', function () {
            userInteracted = true;
            updateState();
        });
    }

    document.addEventListener('change', function (e) {
        if (e.target.matches('input[name="brandCode"]')) {
            userInteracted = true;
            updateState();
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target.closest('.js-applybalancebutton')) {
            userInteracted = true;
            updateState();
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            userInteracted = true;
            if (giftInput) giftInput.value = '';
            updateState();
        });
    }

    // Observe DOM changes (for dynamically applied gift cards)
    var observer = new MutationObserver(function () {
        updateState();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    function selectDefaultPayment() {

        var storedCard = document.querySelector('input[name="brandCode"][value^="storedCard"]');
    
        if (storedCard) {
            storedCard.checked = true;
            storedCard.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
    
        var creditCard = document.getElementById('rb_scheme');
    
        if (creditCard) {
            creditCard.checked = true;
            creditCard.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    // Initial state
    selectDefaultPayment();
    updateState();

});

function applyGiftCertificateToBasket () {
    $('body').on('click', '.giftcertificate-information .js-applybalancebutton', function (e) {
        e.preventDefault();

        var button = $(this);
        button.attr('disabled', true);
        var container = button.parents('.giftcertificate-information');
        var checkoutForm = button.parents('form');
        var inputWrapper = $('.giftcertificate-information .giftCertificate-input-wrapper')
        var reviewOrdertBtn = $('.btn.btn-primary.btn-block.submit-payment');
        container.spinner().start();

        var url = button.data('action');
        inputWrapper.removeClass('is-valid is-invalid');

        //because the error is not an html5 error typically (balance is 0 or does not exist)
        //we must clear the previous error + message manually
        formErrors.clearPreviousErrors(container);
        recaptcha.check(e, {
            url: url,
            method: 'POST',
            data: checkoutForm.serialize() + '&format=ajax',
            success: function (data) {
                if (data.success) {
                    displayMessage(data, button);
                    $('.js-giftcertificatepaymentinstruments').html(data.template);
                    inputWrapper.addClass('is-valid');
                    reviewOrdertBtn.attr('disabled',false);
                    $('input#giftcertificateid').val('');
                    const giftCertificateCodesHtml = giftCertificateCodePillHtml(data);
                    $('.giftCertificateCode-pills-wrapper').empty().append(giftCertificateCodesHtml);
                    $('body').trigger('checkout:updateCheckoutViewPaymentInformation', { order: data.order });
                } else {
                    inputWrapper.addClass('is-invalid');
                    reviewOrdertBtn.attr('disabled',true);
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        container.find('.js-balancemsg').html('');
                        formValidation(container, data);
                        if (data.msg) {
                            displayMessage(data, button);
                        }
                    }
                }

                $.spinner().stop();
                button.removeAttr('disabled');
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                inputWrapper.addClass('is-invalid');
                displayMessage(err, button);
            }
        });

    })
}

function removeGiftCertificatePaymentInstrument() {
    $('body').on('click', '.js-remove-giftcertificate-pi', function (e) {
        e.preventDefault();

        var button = $(this);
        button.attr('disabled', true);

        var container = button.parents('.giftcertificate-information');
        container.spinner().start();

        var url = button.data('action');
        var giftCertificateCode = button.data('giftcertificatecode');
        $.ajax({
            url: url,
            method: 'POST',
            dataType: 'json',
            data: '&giftCertificateCode=' + giftCertificateCode,
            success: function (data) {
                if (data.success) {
                    $('.js-giftcertificatepaymentinstruments').html(data.template);
                    const giftCertificateCodesHtml = giftCertificateCodePillHtml(data);
                    $('.giftCertificateCode-pills-wrapper').empty().append(giftCertificateCodesHtml);
                    $('.giftCertificate-input-area .clear_giftcertificate_input').addClass('d-none'); 
                    if(data.order.billing.payment.selectedPaymentInstruments.length === 0) {
                        $('.giftcertificate-information .giftCertificate-input-wrapper').removeClass('is-valid is-invalid');
                    }

                    $('body').trigger('checkout:updateCheckoutViewPaymentInformation', { order: data.order });
                }

                $.spinner().stop();
                displayMessage(data, button);
            },
            error: function (err) {
                displayMessage(err, button);
            }
        });
    });
}

module.exports = {
    displayMessage: displayMessage,
    giftCertificateFormSubmission: giftCertificateFormSubmission,
    updateGiftCertificateLineItem: updateGiftCertificateLineItem,
    checkBalanceFormSubmission: checkBalanceFormSubmission,
    applyGiftCertificateToBasket: applyGiftCertificateToBasket,
    removeGiftCertificatePaymentInstrument: removeGiftCertificatePaymentInstrument,
    init: function () {
        module.exports.giftCertificateFormSubmission();
        module.exports.checkBalanceFormSubmission();
        module.exports.applyGiftCertificateToBasket();
        module.exports.removeGiftCertificatePaymentInstrument();
    }
};
