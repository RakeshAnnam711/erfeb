/* eslint-env es6 */
/* eslint-disable no-console */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
/* eslint-disable dot-notation */
/* eslint-disable no-plusplus */
/* eslint-disable require-jsdoc */
/* globals Stripe, $ */

'use strict';
var stripeOptions = [];

var STRIPE_CONSTANTS = {
    paymentElement: {
        ismlElementID: '#payment-element',
        instanceName: 'paymentElementInstance',
        elementsName: 'stripePaymentElements',
        optionsUrlElement: 'getPaymentElementOptions'
    },
    bankTransferElement: {
        ismlElementID: '#stripe-bank-transfer-element',
        instanceName: 'bankTransferElementInstance',
        elementsName: 'stripeBankTransferElements',
        optionsUrlElement: 'getBankTransferElementOptions'
    }
}

function getInputValueById(id) {
    var element = document.getElementById(id);

    return element && typeof element.value !== 'undefined' ? element.value : '';
}

var betas = getInputValueById('stripePaymentMethodsInBeta');
if (betas) {
    stripeOptions.betas = betas.split(',');
}

var stripeApiVersion = getInputValueById('stripeApiVersion');
if (stripeApiVersion) {
    stripeOptions.apiVersion = stripeApiVersion;
}

var stripePublicKey = getInputValueById('stripePublicKey');
var stripe = stripePublicKey && typeof Stripe === 'function' ? Stripe(stripePublicKey, stripeOptions) : null;
var elements = stripe ? stripe.elements() : null;

function stripeCheckoutLog(step, payload) {
    var message = '[StripeCheckout][' + step + ']';

    if (typeof payload === 'undefined') {
        console.log(message);
        return;
    }

    console.log(message, payload);
}

function getSelectedPaymentMethod() {
    var activeNavMethod = null;
    var $activeNavItem = $('.payment-options .nav-item').has('a.nav-link.active').first();

    if ($activeNavItem.length) {
        activeNavMethod = $activeNavItem.data('method-id');
    }

    if (!activeNavMethod) {
        var activeLink = $('.payment-options a.nav-link.active').first();
        if (activeLink.length) {
            activeNavMethod = activeLink.closest('[data-method-id]').data('method-id')
                || activeLink.data('method-id')
                || activeLink.attr('data-method-id');
        }
    }

    if (activeNavMethod) {
        return activeNavMethod;
    }

    var selectedPaymentOption = document.getElementById('selectedPaymentOption');
    if (selectedPaymentOption && selectedPaymentOption.value) {
        return selectedPaymentOption.value;
    }

    var paymentInfoMethod = $('.payment-information').attr('data-payment-method-id')
        || $('.payment-information').data('payment-method-id');
    if (paymentInfoMethod) {
        return paymentInfoMethod;
    }

    var activeTab = $('.payment-form .tab-pane.active').first();

    if (!activeTab.length) {
        var activeLinkHref = $('.payment-options a.nav-link.active').first().attr('href');
        if (activeLinkHref && activeLinkHref.indexOf('#') === 0) {
            activeTab = $(activeLinkHref).first();
        }
    }

    if (activeTab.length) {
        var paymentMethodInput = activeTab.find('input[name$="_paymentMethod"]').first();
        if (!paymentMethodInput.length) {
            paymentMethodInput = activeTab.find('input[name="dwfrm_billing_paymentMethod"]').first();
        }
        if (paymentMethodInput.length && paymentMethodInput.val()) {
            return paymentMethodInput.val();
        }
    }

    // Do NOT fall back to the first paymentMethod input in the form — after Edit Payment
    // that often returns a stale/hidden tab value and sends Stripe to PlaceOrder.
    return '';
}

window.getSelectedPaymentMethod = getSelectedPaymentMethod;

function isStripeCheckoutPaymentMethod(methodId) {
    return methodId === 'STRIPE_PAYMENT_ELEMENT'
        || methodId === 'CREDIT_CARD'
        || methodId === 'BANK_TRANSFER';
}

function resolvePlaceOrderPaymentMethod() {
    var fromDom = getSelectedPaymentMethod();
    var fromStorage = window.localStorage.getItem('stripe_payment_method') || '';
    var fromSelectedOption = document.getElementById('selectedPaymentOption');
    var fromPaymentInfo = $('.payment-information').attr('data-payment-method-id')
        || $('.payment-information').data('payment-method-id')
        || '';

    // After Edit Payment, DOM tabs are often inconsistent. Prefer an explicit Stripe
    // selection from storage/hidden fields over a wrong active-tab guess.
    if (isStripeCheckoutPaymentMethod(fromStorage)) {
        return fromStorage;
    }
    if (isStripeCheckoutPaymentMethod(fromDom)) {
        return fromDom;
    }
    if (fromSelectedOption && isStripeCheckoutPaymentMethod(fromSelectedOption.value)) {
        return fromSelectedOption.value;
    }
    if (isStripeCheckoutPaymentMethod(fromPaymentInfo)) {
        return fromPaymentInfo;
    }

    return fromDom || fromPaymentInfo || (fromSelectedOption && fromSelectedOption.value) || fromStorage || '';
}

function clearStaleStripePaymentInstruments() {
    var clearUrlElement = document.getElementById('clearStripePaymentInstrumentsURL');

    if (!clearUrlElement || !clearUrlElement.value) {
        return;
    }

    var csrfInput = document.querySelector('[name="csrf_token"]');

    $.ajax({
        url: clearUrlElement.value,
        method: 'POST',
        dataType: 'json',
        data: {
            csrf_token: csrfInput ? csrfInput.value : ''
        }
    });
}

function setBillingFormPaymentMethod(paymentMethodId) {
    if (!paymentMethodId) {
        return;
    }

    var paymentMethodInputs = document.querySelectorAll('#dwfrm_billing input[name$="_paymentMethod"]');
    paymentMethodInputs.forEach(function (input) {
        input.value = paymentMethodId;
    });

    var selectedPaymentOptionInput = document.getElementById('selectedPaymentOption');
    if (selectedPaymentOptionInput) {
        selectedPaymentOptionInput.value = paymentMethodId;
    }
}

function isZeroStripeOrderAmount() {
    var stripeOrderAmountInput = document.getElementById('stripe_order_amount');
    var amountValue = NaN;

    if (stripeOrderAmountInput) {
        var normalizedValue = String(stripeOrderAmountInput.value || '').replace(',', '.');
        amountValue = parseFloat(normalizedValue);
    }

    // Prefer live order-summary remainder after GC apply (hidden input can be stale).
    var grandTotalEl = document.querySelector('[data-grand-total-sum]');
    if (grandTotalEl) {
        var liveRemainder = parseFloat(String(grandTotalEl.getAttribute('data-grand-total-sum') || '').replace(',', '.'));
        if (!isNaN(liveRemainder)) {
            amountValue = liveRemainder;
        }
    }

    return !isNaN(amountValue) && amountValue <= 0;
}

function clearStripePayloadData() {
    var stripeSourceInputs = document.getElementsByName('stripe_source_id');
    var i;

    if (stripeSourceInputs && stripeSourceInputs.length) {
        for (i = 0; i < stripeSourceInputs.length; i++) {
            stripeSourceInputs[i].value = '';
        }
    }

    if (cardNumberInput) { cardNumberInput.value = ''; }
    if (cardHolderInput) { cardHolderInput.value = ''; }
    if (cardTypeInput) { cardTypeInput.value = ''; }
    if (cardTypeInputSFCC) { cardTypeInputSFCC.value = ''; }
    if (cardBrandInput) { cardBrandInput.value = ''; }
    if (cardExpMonthInput) { cardExpMonthInput.value = ''; }
    if (cardExpYearInput) { cardExpYearInput.value = ''; }
    if (prUsedInput) { prUsedInput.value = ''; }
}

function setCustomCardOutcome(result) {
    var displayError = document.getElementById('card-errors');
    if (result.error) {
        displayError.textContent = result.error.message;
    } else {
        displayError.textContent = '';
    }
}

var cardBrandToPfClass = {
    visa: 'pf-visa',
    mastercard: 'pf-mastercard',
    amex: 'pf-american-express',
    discover: 'pf-discover',
    diners: 'pf-diners',
    jcb: 'pf-jcb',
    unknown: 'pf-credit-card'
};

function setCustomCardBrandIcon(brand) {
    var brandIconElement = document.getElementById('brand-icon');
    var pfClass = 'pf-credit-card';
    if (brand in cardBrandToPfClass) {
        pfClass = cardBrandToPfClass[brand];
    }

    for (var i = brandIconElement.classList.length - 1; i >= 0; i--) {
        brandIconElement.classList.remove(brandIconElement.classList[i]);
    }
    brandIconElement.classList.add('pf');
    brandIconElement.classList.add(pfClass);
}

var cardElement = null;
var cardNumberElement = null;
if (elements && document.getElementById('card-element')) {
    cardElement = elements.create('card');
    cardElement.mount('#card-element');
    cardElement.addEventListener('change', function (event) {
        var displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
} else if (elements && document.getElementById('stripe-custom-card-group')) {
    var style = JSON.parse(document.getElementById('stripe-custom-card-group').dataset.elementstyle);

    cardNumberElement = elements.create('cardNumber', {
        style: style
    });
    cardNumberElement.mount('#card-number-element');

    var cardExpiryElement = elements.create('cardExpiry', {
        style: style
    });
    cardExpiryElement.mount('#card-expiry-element');

    var cardCvcElement = elements.create('cardCvc', {
        style: style
    });
    cardCvcElement.mount('#card-cvc-element');

    cardNumberElement.on('change', function (event) {
        // Switch brand logo
        if (event.brand) {
            setCustomCardBrandIcon(event.brand);
        }

        setCustomCardOutcome(event);
    });
}

var newCardFormContainer = document.getElementById('new-card-form-container');
var savedCardsFormContainer = document.getElementById('saved-cards-container');
var cardIdInput = document.getElementsByName('stripe_source_id');
var cardNumberInput = document.getElementById('stripe_card_number');
var cardHolderInput = document.getElementById('stripe_card_holder');
var cardTypeInput = document.getElementById('stripe_card_type');
var cardTypeInputSFCC = document.getElementById('cardType');
var cardBrandInput = document.getElementById('stripe_card_brand');
var cardExpMonthInput = document.getElementById('stripe_card_expiration_month');
var cardExpYearInput = document.getElementById('stripe_card_expiration_year');
var prUsedInput = document.getElementById('stripe_pr_used');

var forceSubmit = false;
var prUsed = false;

function toggleCardFormVisibility(showNewCardForm) {
    if (!newCardFormContainer || !savedCardsFormContainer) {
        return;
    }

    newCardFormContainer.style.display = showNewCardForm ? 'block' : 'none';
    savedCardsFormContainer.style.display = showNewCardForm ? 'none' : 'block';
}

var switchToSavedCardsLink = document.getElementById('switch-to-saved-cards');
if (switchToSavedCardsLink && newCardFormContainer && savedCardsFormContainer) {
    switchToSavedCardsLink.addEventListener('click', function () {
        toggleCardFormVisibility(false);
    });
}

var switchToNewCardLink = document.getElementById('switch-to-add-card');
if (switchToNewCardLink && newCardFormContainer && savedCardsFormContainer) {
    switchToNewCardLink.addEventListener('click', function () {
        toggleCardFormVisibility(true);
    });
}

if (savedCardsFormContainer && newCardFormContainer) {
    toggleCardFormVisibility(false);
    syncCheckedSavedCardToHiddenInputs();
}

function isSavedCard() {
    var savedCards = document.getElementById('saved-cards-container');
    var newCardForm = document.getElementById('new-card-form-container');

    if (!savedCards) {
        return false;
    }

    var savedVisible = savedCards.style.display !== 'none'
        && (savedCards.style.display === 'block'
            || savedCards.offsetParent !== null
            || (window.getComputedStyle && window.getComputedStyle(savedCards).display !== 'none'));
    var newCardHidden = !newCardForm
        || newCardForm.style.display === 'none'
        || (window.getComputedStyle && window.getComputedStyle(newCardForm).display === 'none');

    return !!(savedVisible && newCardHidden);
}

function capitalize(text) {
    if (!text) {
        return '';
    }

    return text.replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
    });
}

/**
 * Sync the checked saved-card radio into hidden billing fields.
 * First card is often pre-checked in HTML so "change" never fires after Edit Payment.
 */
function syncCheckedSavedCardToHiddenInputs() {
    var savedCard = document.querySelector('input[name=saved_card_id]:checked');

    if (!savedCard || !savedCard.value) {
        return false;
    }

    if (typeof cardIdInput !== 'undefined' && cardIdInput && cardIdInput.length) {
        cardIdInput.forEach(function (input) {
            input.value = savedCard.value;
        });
    }

    if (cardNumberInput) { cardNumberInput.value = savedCard.dataset.cardnumber || ''; }
    if (cardHolderInput) { cardHolderInput.value = savedCard.dataset.cardholder || ''; }
    if (cardTypeInput) { cardTypeInput.value = savedCard.dataset.cardtype || ''; }
    if (cardTypeInputSFCC) { cardTypeInputSFCC.value = capitalize(savedCard.dataset.cardtype || ''); }
    if (cardExpMonthInput) { cardExpMonthInput.value = savedCard.dataset.cardexpmonth || ''; }
    if (cardExpYearInput) { cardExpYearInput.value = savedCard.dataset.cardexpyear || ''; }
    if (prUsedInput) { prUsedInput.value = ''; }

    return true;
}

function copySelectedSaveCardDetails() {
    syncCheckedSavedCardToHiddenInputs();
}

function copyNewCardDetails(paymentMethod) {
    cardIdInput.forEach(function (input) {
        input.value = paymentMethod.id;
    });

    if (paymentMethod.card) {
        cardNumberInput.value = '************' + paymentMethod.card.last4;
        cardTypeInput.value = '';
        cardTypeInputSFCC.value = capitalize(paymentMethod.card.brand);
        cardBrandInput.value = paymentMethod.card.brand;
        cardExpMonthInput.value = paymentMethod.card.exp_month;
        cardExpYearInput.value = paymentMethod.card.exp_year;
    }
    cardHolderInput.value = paymentMethod.billing_details && paymentMethod.billing_details.name;
    prUsedInput.value = '';
}

function getOwnerDetails() {
    var stateElement = document.querySelector('.billing-address select[name$="_stateCode"]') || document.querySelector('.billing-address input[name$="_stateCode"]')
        || document.querySelector('select[name$="_stateCode"]') || document.querySelector('input[name$="_stateCode"]');

    var ownerNames = (document.querySelector('.billing-address input[name$="_firstName"]') && document.querySelector('.billing-address input[name$="_lastName"]'))
        ? document.querySelector('.billing-address input[name$="_firstName"]').value + ' ' + document.querySelector('.billing-address input[name$="_lastName"]').value
        : document.querySelector('input[name$="_firstName"]').value + ' ' + document.querySelector('input[name$="_lastName"]').value;

    var addrLine1 = document.querySelector('.billing-address input[name$="_address1"]')
        ? document.querySelector('.billing-address input[name$="_address1"]').value : document.querySelector('input[name$="_address1"]').value;

    var addrLine2 = document.querySelector('.billing-address input[name$="_address2"]')
        ? document.querySelector('.billing-address input[name$="_address2"]').value : document.querySelector('input[name$="_address2"]').value;

    var addrCity = document.querySelector('.billing-address input[name$="_city"]')
        ? document.querySelector('.billing-address input[name$="_city"]').value : document.querySelector('input[name$="_city"]').value;

    var addrPostalCode = document.querySelector('.billing-address input[name$="_postalCode"]')
        ? document.querySelector('.billing-address input[name$="_postalCode"]').value : document.querySelector('input[name$="_postalCode"]').value;

    var addrCountry = document.querySelector('.billing-address select[name$="_country"]')
        ? document.querySelector('.billing-address select[name$="_country"]').value : document.querySelector('select[name$="_country"]').value;

    var ownerEmail = '';
    if ($('.customer-summary-email').length && $('.customer-summary-email').text()) {
        ownerEmail = $('.customer-summary-email').text();
    } else {
        ownerEmail = document.querySelector('#dwfrm_billing input[name$="_email"]')
            ? document.querySelector('#dwfrm_billing input[name$="_email"]').value
            : document.querySelector('input[name$="_email"]').value;
    }

    // SFRA 6 issue with email not presented on checkout
    if (!ownerEmail || ownerEmail === 'null') {
        $.ajax({
            url: document.getElementById('getCustomerEmailURL').value,
            method: 'GET',
            dataType: 'json',
            async: false
        }).done(function (json) {
            ownerEmail = json.email;
            $('.customer-summary-email').text(json.email);
        });
    }

    var ownerPhone = document.querySelector('#dwfrm_billing input[name$="_phone"]')
        ? document.querySelector('#dwfrm_billing input[name$="_phone"]').value : document.querySelector('input[name$="_phone"]').value;

    return {
        name: ownerNames,
        address: {
            line1: addrLine1,
            line2: addrLine2,
            city: addrCity,
            postal_code: addrPostalCode,
            country: addrCountry,
            state: stateElement ? stateElement.value : ''
        },
        email: ownerEmail,
        phone: ownerPhone
    };
}

function populateBillingData(pr) {
    var form = document.getElementById('dwfrm_billing');

    var payerName = pr.payerName;
    if (payerName) {
        var payerNameSplit = payerName.split(' ');

        if (payerNameSplit.length > 1) {
            var firstName = payerNameSplit[0];
            var lastName = payerNameSplit[1];

            form.querySelector('input[name$="_firstName"]').value = firstName;
            form.querySelector('input[name$="_lastName"]').value = lastName;
        } else {
            form.querySelector('input[name$="_firstName"]').value = payerName;
            form.querySelector('input[name$="_lastName"]').value = payerName;
        }
    }

    form.querySelector('input[name$="_email"]').value = pr.payerEmail;
    form.querySelector('input[name$="_phone"]').value = pr.payerPhone;

    var selectCountryElement = form.querySelector('select[name$="_country"]');
    var prCountry = pr.paymentMethod.billing_details.address.country.toLowerCase();
    var prCountryExists = ($('#' + selectCountryElement.id + ' option[value=' + prCountry + ']').length > 0);

    if (prCountryExists) {
        selectCountryElement.value = prCountry;
    }

    form.querySelector('input[name$="_city"]').value = pr.paymentMethod.billing_details.address.city;
    form.querySelector('input[name$="_postalCode"]').value = pr.paymentMethod.billing_details.address.postal_code;
    form.querySelector('input[name$="_address1"]').value = pr.paymentMethod.billing_details.address.line1;
    form.querySelector('input[name$="_address2"]').value = pr.paymentMethod.billing_details.address.line2;

    var stateElement = form.querySelector('select[name$="_stateCode"]') || form.querySelector('input[name$="_stateCode"]');
    stateElement.value = pr.paymentMethod.billing_details.address.state;
}

function updateBillingAddressAjax(billingAddress) {
    var url = $('#updateBillingAddress').val();
    $.ajax({
        type: 'post',
        url: url,
        data: JSON.stringify(billingAddress),
        contentType: 'application/json; charset=utf-8',
        traditional: true,
        success: function (data) {
            if (data.success) {
                console.log('User billing address updated successfully.');
            } else {
                console.log('billing address update failed.');
            }
        }
    });
}

function updateUserProfileBillingAddress() {
    if ($('#billingAddressSelector').length) {
        var selectedBillingAddress = $('#billingAddressSelector').find(':selected');
        if (selectedBillingAddress.hasClass('isBillingAddress')) {
            var billingAddress = {};
            billingAddress.addressId = selectedBillingAddress.val();
            billingAddress.firstName = $('#billingFirstName').val();
            billingAddress.lastName = $('#billingLastName').val();
            billingAddress.address1 = $('#billingAddressOne').val();
            billingAddress.address2 = $('#billingAddressTwo').val();
            billingAddress.city = $('#billingAddressCity').val();
            billingAddress.states = {};
            billingAddress.states.stateCode = $('#billingState').val();
            billingAddress.postalCode = $('#billingZipCode').val();
            billingAddress.countryCode = $('#billingCountry').val();
            billingAddress.phone = $('#phoneNumber').val();

            updateBillingAddressAjax(billingAddress);
        }
    }
}

var submitPaymentButton = document.querySelector('button.submit-payment');
var allowStripeSubmitPaymentPassThrough = false;
var stripePaymentElementSubmitValidated = false;

/**
 * PE / Link may surface email, billing phone, or Link auth mobile (linkMobilePhone).
 * Those must not block Review Order — checkout already has contact details, and Link
 * mobile is Stripe-owned auth UI we cannot mark optional via fields.billingDetails.
 */
function getStripeErrorHaystack(error) {
    if (!error) {
        return '';
    }
    return [
        error.code || '',
        error.message || '',
        error.param || '',
        error.type || ''
    ].join(' ').toLowerCase();
}

function isLinkMobilePhoneError(error) {
    var haystack = getStripeErrorHaystack(error);
    return /(linkmobilephone|link.?mobile|mobile number|field-linkmobilephone|payment-linkmobilephone)/.test(haystack);
}

function isOptionalStripeContactFieldError(error) {
    if (!error) {
        return false;
    }

    if (isLinkMobilePhoneError(error)) {
        return true;
    }

    var haystack = getStripeErrorHaystack(error);
    var isContact = /(e-?mail|phone|telephone|mobile|billing_details\.(email|phone|name)|customer.?email|link\.|klarna)/.test(haystack);
    if (!isContact) {
        return false;
    }

    // Card-only required fields — do not treat phone "invalid number" as a card failure.
    var isCardOnly = /(incomplete_cvc|incomplete_expiry|card.?number|\bcvc\b|\bcvv\b)/.test(haystack)
        && !/(phone|mobile|e-?mail|link)/.test(haystack);
    return !isCardOnly;
}

function isWalletOrApmPaymentElementType(type) {
    var normalized = String(type || '').toLowerCase();
    return normalized === 'link'
        || normalized === 'klarna'
        || normalized === 'afterpay_clearpay'
        || normalized === 'affirm'
        || normalized === 'paypal'
        || normalized === 'cashapp'
        || normalized === 'amazon_pay';
}

function isIgnorablePeSubmitError(error) {
    if (!error) {
        return false;
    }

    // Link auth mobile (aria-required in PE iframe) — never block Review Order.
    if (isLinkMobilePhoneError(error)) {
        return true;
    }

    if (!isOptionalStripeContactFieldError(error)) {
        return false;
    }

    // Link / Klarna / other APMs: email/phone / Link contact details must never block.
    if (isWalletOrApmPaymentElementType(window.stripePaymentElementType)) {
        return true;
    }

    // Link UI sometimes reports type=card after saved Link PM; still ignore contact errors.
    if (window.stripePaymentElementType === 'card'
            && isOptionalStripeContactFieldError(error)) {
        return true;
    }

    return window.stripePaymentElementComplete === true
        || window.stripePaymentElementEmpty === false
        || !!window.stripePaymentElementType;
}

function resetStripePaymentElementSubmitValidated() {
    stripePaymentElementSubmitValidated = false;
}

function markStripePaymentElementSubmitValidated() {
    stripePaymentElementSubmitValidated = true;
}

function getStripePaymentElementsInstance() {
    return window.stripePaymentElements || stripeElements.paymentElement;
}

function continueStripeSubmitPayment(paymentMethodName) {
    $('.payment-details').text(paymentMethodName);
    $('.payment-details').removeClass('payment-details').addClass('payment-details-stripe');

    allowStripeSubmitPaymentPassThrough = true;
    var payBtn = document.querySelector('button.submit-payment');
    if (payBtn) {
        payBtn.click();
    }
}

function showStripePaymentElementValidationError(error) {
    var peErrorMsg = (error && error.message) || 'Please complete your payment information.';
    alert(peErrorMsg);
    var peNode = document.getElementById('payment-element');
    if (peNode && typeof peNode.scrollIntoView === 'function') {
        peNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

if (submitPaymentButton) {
submitPaymentButton.addEventListener('click', function (event) {
    // Second pass after we sync saved-card / create PaymentMethod — let SFRA SubmitPayment run.
    if (allowStripeSubmitPaymentPassThrough) {
        allowStripeSubmitPaymentPassThrough = false;
        return;
    }

    var paymentMethodName;
    var selectedMethod = getSelectedPaymentMethod();

    setBillingFormPaymentMethod(selectedMethod);

    stripeCheckoutLog('submit-payment:selected-method', {
        selectedMethod: selectedMethod,
        activeTabId: $('.tab-pane.active').first().attr('id')
    });

    // Stripe Payment Element: validate incomplete card/APM fields before SubmitPayment.
    // Optional PE email/phone must not block when payment details are complete.
    // eslint-disable-next-line
    if (selectedMethod == 'STRIPE_PAYMENT_ELEMENT') {
        window.localStorage.setItem('stripe_payment_method', 'STRIPE_PAYMENT_ELEMENT');
        paymentMethodName = $('*[data-method-id="STRIPE_PAYMENT_ELEMENT"] > a').text();

        event.preventDefault();
        event.stopImmediatePropagation();

        var peElements = getStripePaymentElementsInstance();
        if (!peElements || typeof peElements.submit !== 'function') {
            alert('Payment form is not ready. Please wait a moment and try again.');
            return;
        }

        // Always call elements.submit() — Link/wallet PMs can report complete=true before
        // submit runs; skipping submit breaks Place Order createConfirmationToken.
        peElements.submit().then(function (result) {
            if (result && result.error) {
                if (isIgnorablePeSubmitError(result.error)) {
                    markStripePaymentElementSubmitValidated();
                    continueStripeSubmitPayment(paymentMethodName);
                    return;
                }
                showStripePaymentElementValidationError(
                    isOptionalStripeContactFieldError(result.error)
                        ? { message: 'Please complete your payment information.' }
                        : result.error
                );
                return;
            }

            markStripePaymentElementSubmitValidated();
            continueStripeSubmitPayment(paymentMethodName);
        }).catch(function (err) {
            if (isIgnorablePeSubmitError(err)) {
                markStripePaymentElementSubmitValidated();
                continueStripeSubmitPayment(paymentMethodName);
                return;
            }
            showStripePaymentElementValidationError(err);
        });

        return;
    }

    if (selectedMethod == 'BANK_TRANSFER') {
        window.localStorage.setItem('stripe_payment_method', 'BANK_TRANSFER');
        paymentMethodName = $('*[data-method-id="BANK_TRANSFER"] > a').text();

        event.preventDefault();
        event.stopImmediatePropagation();

        var btElements = window.stripeBankTransferElements || stripeElements.bankTransferElement;
        if (!btElements || typeof btElements.submit !== 'function') {
            alert('Payment form is not ready. Please wait a moment and try again.');
            return;
        }

        btElements.submit().then(function (result) {
            if (result && result.error) {
                alert((result.error && result.error.message) || 'Please complete your payment information.');
                return;
            }

            $('.payment-details').text(paymentMethodName);
            $('.payment-details').removeClass('payment-details').addClass('payment-details-stripe');

            allowStripeSubmitPaymentPassThrough = true;
            var btPayBtn = document.querySelector('button.submit-payment');
            if (btPayBtn) {
                btPayBtn.click();
            }
        }).catch(function (err) {
            alert((err && err.message) || 'Please complete your payment information.');
        });

        return;
    }

    if (selectedMethod === 'CREDIT_CARD') {
        window.localStorage.setItem('stripe_payment_method', 'CREDIT_CARD');
    } else {
        window.localStorage.setItem('stripe_payment_method', '');
        return;
    }

    // Saved card: sync radios → hidden fields, then let SFRA call SubmitPayment.
    // Do NOT stopImmediatePropagation or re-click — that blocked SubmitPayment / caused PlaceOrder.
    if (isSavedCard() || syncCheckedSavedCardToHiddenInputs()) {
        syncCheckedSavedCardToHiddenInputs();
        updateUserProfileBillingAddress();
        return;
    }

    let billingForm = document.getElementById('dwfrm_billing');
    $(billingForm).find('.form-control.is-invalid').removeClass('is-invalid');
    if (!billingForm.reportValidity()) {
        billingForm.focus();
        billingForm.scrollIntoView();
        return;
    }

    event.stopImmediatePropagation();
    updateUserProfileBillingAddress();
    var selectedPaymentMethod = selectedMethod;

    window.localStorage.setItem('stripe_payment_method', selectedPaymentMethod);

    switch (selectedPaymentMethod) {
        case 'CREDIT_CARD':
            if (prUsed) {
                console.log('submit prUsed');
            } else {
                if (!stripe) {
                    stripeCheckoutLog('submit-payment:stripe-unavailable', {
                        hasStripeFunction: typeof Stripe === 'function',
                        hasStripePublicKey: !!stripePublicKey
                    });
                    return;
                }

                var owner = getOwnerDetails();
                var stripeCardEl = (!cardElement) ? cardNumberElement : cardElement;
                stripe.createPaymentMethod('card', stripeCardEl, {
                    billing_details: {
                        name: owner.name,
                        address: owner.address,
                        email: owner.email,
                        phone: owner.phone
                    }
                }).then(function (result) {
                    if (result.error) {
                        alert(result.error.message);
                    } else {
                        copyNewCardDetails(result.paymentMethod);
                        allowStripeSubmitPaymentPassThrough = true;
                        var payBtn = document.querySelector('button.submit-payment');
                        if (payBtn) {
                            payBtn.click();
                        }
                    }
                });
            }
            break;
        default:
            break;
    }
});
}

// fix issue with SFRA select payment method when edit payment from Order confirmation
var ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

ready(() => {
    $('body').on('click', '.payment-options .nav-item a.nav-link', function () {
        var selectedMethod = $(this).closest('[data-method-id]').data('method-id')
            || $(this).data('method-id')
            || $(this).attr('data-method-id');

        if (selectedMethod) {
            setBillingFormPaymentMethod(selectedMethod);

            if (selectedMethod !== 'STRIPE_PAYMENT_ELEMENT' && selectedMethod !== 'CREDIT_CARD' && selectedMethod !== 'BANK_TRANSFER') {
                window.localStorage.setItem('stripe_payment_method', '');
                // Clear basket Stripe only when leaving Stripe for another method (e.g. PayPal).
                clearStaleStripePaymentInstruments();
            } else {
                window.localStorage.setItem('stripe_payment_method', selectedMethod);
                // Reset after Edit Payment / prior Place Order attempt so Stripe endpoints run again.
                forceSubmit = false;
                isStripeElementSubmitInProgress = false;
                resetStripePaymentElementSubmitValidated();

                if (selectedMethod === 'CREDIT_CARD') {
                    if (isSavedCard()) {
                        syncCheckedSavedCardToHiddenInputs();
                    }
                } else if (selectedMethod === 'STRIPE_PAYMENT_ELEMENT' || selectedMethod === 'BANK_TRANSFER') {
                    setTimeout(function () {
                        initAvailableElements();
                    }, 0);
                }
            }
        }
    });

    $(document).on('change', 'input[name="saved_card_id"]', function () {
        syncCheckedSavedCardToHiddenInputs();
    });

    var paymentSummaryEditButton = document.querySelector('.payment-summary .edit-button');
    var shippingSummaryEditButton = document.querySelector('.shipping-summary .edit-button');

    // eslint-disable-next-line no-unused-vars
    if (paymentSummaryEditButton) paymentSummaryEditButton.addEventListener('click', (e) => {
        // Do not wipe tab-pane active state here — that breaks payment-method detection
        // on the next Place Order and falls through to CheckoutServices-PlaceOrder.

        forceSubmit = false;
        isStripeElementSubmitInProgress = false;
        resetStripePaymentElementSubmitValidated();
        window.localStorage.removeItem('stripe_pe_continueurl');
        window.localStorage.removeItem('stripe_pe_orderid');
        window.localStorage.removeItem('stripe_pe_ordertoken');

        // Keep DOM stage in sync with SFRA members.gotoStage('payment') so the
        // Review Order button cannot run PlaceOrder on a stale placeOrder stage.
        var stageHost = document.getElementById('checkout-main')
            || document.querySelector('.data-checkout-stage');
        if (stageHost) {
            stageHost.setAttribute('data-checkout-stage', 'payment');
        }

        // Drop the SubmitPayment Stripe PI so retry starts clean. Clear is async but
        // Review Order / Place Order give it time; PlaceOrder guard blocks underpay.
        clearStaleStripePaymentInstruments();

        setTimeout(function () {
            var selectedMethod = resolvePlaceOrderPaymentMethod();

            if (selectedMethod === 'CREDIT_CARD') {
                window.localStorage.setItem('stripe_payment_method', 'CREDIT_CARD');
                setBillingFormPaymentMethod('CREDIT_CARD');
                if (isSavedCard()) {
                    syncCheckedSavedCardToHiddenInputs();
                }
            } else if (selectedMethod === 'STRIPE_PAYMENT_ELEMENT' || selectedMethod === 'BANK_TRANSFER') {
                window.localStorage.setItem('stripe_payment_method', selectedMethod);
                setBillingFormPaymentMethod(selectedMethod);
                initAvailableElements();
            } else if (selectedMethod) {
                setBillingFormPaymentMethod(selectedMethod);
            }
        }, 100);
    });

    // eslint-disable-next-line no-unused-vars
    if (shippingSummaryEditButton) shippingSummaryEditButton.addEventListener('click', (e) => {
        var list = document.querySelector('.payment-form').querySelectorAll('.tab-pane');
        for (var i = 0; i < list.length; ++i) {
            list[i].classList.remove('active');
        }

        var activePaymentMethod = document.getElementsByClassName('nav-link credit-card-tab active');
        if (activePaymentMethod.length) {
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes['href'].value.replace('#', ''));

            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });
});

function redirectToCheckoutSummaryPage() {
    var continueUrl = window.localStorage.getItem('stripe_pe_continueurl');
    var orderId = window.localStorage.getItem('stripe_pe_orderid');
    var orderToken = window.localStorage.getItem('stripe_pe_ordertoken');

    if (continueUrl && orderId && orderToken) {
        var form = document.createElement('form');
        form.style.display = 'none';

        document.body.appendChild(form);

        form.method = 'POST';
        form.action = continueUrl;

        var orderIdInput = document.createElement('input');
        orderIdInput.name = 'orderID';
        orderIdInput.value = orderId;
        form.appendChild(orderIdInput);

        var orderTokenInput = document.createElement('input');
        orderTokenInput.name = 'orderToken';
        orderTokenInput.value = orderToken;
        form.appendChild(orderTokenInput);

        form.submit();
    }
}

function stripeFailOrder() {
    $.ajax({
        url: document.getElementById('stripeFailOrderURL').value,
        method: 'POST',
        dataType: 'json',
        data: {
            csrf_token: $('[name="csrf_token"]').val()
        }
    });
}

function elementSubmitControllerCallback(data) {
    isStripeElementSubmitInProgress = false;

    window.localStorage.setItem('stripe_pe_continueurl', data.continueUrl);
    window.localStorage.setItem('stripe_pe_orderid', data.orderID);
    window.localStorage.setItem('stripe_pe_ordertoken', data.orderToken);

    if (data.error) {
        if (data.errorMessage) {
            alert(data.errorMessage);
        }
        window.location.replace(document.getElementById('billingPageUrl').value);
    } else {
        if (data.status === 'requires_action') {
            stripe.handleNextAction({
                clientSecret: data.clientSecret
            }).then(function (handleNextActionResult) {
                if (handleNextActionResult.error) {
                    $.spinner().start();

                    $.ajax({
                        url: document.getElementById('stripeFailOrderURL').value,
                        method: 'POST',
                        dataType: 'json',
                        data: {
                            csrf_token: $('[name="csrf_token"]').val(),
                            errorMessage: handleNextActionResult.error.message
                        },
                        success: function (result) {
                            if (result.success === false) {
                                window.location.replace(result.redirectUrl);
                            } else {
                                alert($('#payment-element').data('errormsg'));
                                window.location.replace(document.getElementById('billingPageUrl').value);
                            }
                        }
                    });
                } else {
                    redirectToCheckoutSummaryPage();
                }
            })
        } else {
            redirectToCheckoutSummaryPage();
        }
    }
    // enable the placeOrder button here
    $('body').trigger('checkout:enableButton', '.next-step-button button');
}

function handleStripeBankTransferSubmitOrder() {
    var bankTransferElements = window.stripeBankTransferElements || stripeElements.bankTransferElement;

    isStripeElementSubmitInProgress = true;

    if (!bankTransferElements || typeof bankTransferElements.submit !== 'function') {
        stripeCheckoutLog('handleStripeBankTransferSubmitOrder:missing-elements', {
            hasWindowElements: !!window.stripeBankTransferElements,
            hasLocalElements: !!stripeElements.bankTransferElement
        });
        isStripeElementSubmitInProgress = false;
        window.location.replace(document.getElementById('billingPageUrl').value);
        return;
    }

    window.stripeBankTransferElements = bankTransferElements;

    bankTransferElements.submit().then(function (result) {
        $('body').trigger('checkout:disableButton', '.next-step-button button');
        $.spinner().start();

        if (result.error) {
            isStripeElementSubmitInProgress = false;
            window.location.replace(document.getElementById('billingPageUrl').value);
            return;
        }

        var stripeBankTransferPaymentData = {
            elements: bankTransferElements,
            params: {
                billing_details: getBillingDetails(null).billingDetails
            }
        }

        stripe.createPaymentMethod(stripeBankTransferPaymentData).then(function(paymentMethodCreationResult) {
            if (paymentMethodCreationResult.error) {
                isStripeElementSubmitInProgress = false;
                window.location.replace(document.getElementById('billingPageUrl').value);
                return;
            } else {

                $.ajax({
                    url: document.getElementById('paymentElementSubmitOrderURL').value,
                    method: 'POST',
                    data: {
                        csrf_token: $('[name="csrf_token"]').val(),
                        bankTransferPaymentMethod: JSON.stringify(paymentMethodCreationResult.paymentMethod)
                    },
                    success: function (data) {
                        elementSubmitControllerCallback(data);
                    },
                    error: function () {
                        isStripeElementSubmitInProgress = false;
                        // enable the placeOrder button here
                        $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                    }
                });
            }
        });
    });
}

function proceedStripePaymentElementConfirmationToken(paymentElements) {
    var stripeReturnURL = document.getElementById('stripe_return_url').value;
    var confirmationElements = getStripePaymentElementsInstance() || paymentElements;

    stripe.createConfirmationToken({
        elements: confirmationElements,
        params: {
            return_url: stripeReturnURL,
            payment_method_data: {
                billing_details: getBillingDetails(null).billingDetails
            }
        }
    }).then(function (createConfirmationTokenResult) {
        if (createConfirmationTokenResult.error) {
            $.ajax({
                url: document.getElementById('logStripeErrorMessageURL').value,
                method: 'POST',
                dataType: 'json',
                data: {
                    csrf_token: $('[name="csrf_token"]').val(),
                    msg: 'UPE stripe.createConfirmationToken Error ' + JSON.stringify(createConfirmationTokenResult.error)
                }
            });

            isStripeElementSubmitInProgress = false;
            window.location.replace(document.getElementById('billingPageUrl').value);
            return;
        }

        $.ajax({
            url: document.getElementById('paymentElementSubmitOrderURL').value,
            method: 'POST',
            data: {
                csrf_token: $('[name="csrf_token"]').val(),
                confirmationToken: JSON.stringify(createConfirmationTokenResult.confirmationToken)
            },
            success: function (data) {
                elementSubmitControllerCallback(data);
            },
            error: function () {
                isStripeElementSubmitInProgress = false;
                $('body').trigger('checkout:enableButton', $('.next-step-button button'));
            }
        });
    }).catch(function (err) {
        stripeCheckoutLog('handleStripePaymentElementSubmitOrder:confirmation-token-error', {
            error: err && err.message ? err.message : err
        });
        isStripeElementSubmitInProgress = false;
        window.location.replace(document.getElementById('billingPageUrl').value);
    });
}

function handleStripePaymentElementSubmitOrder() {
    var paymentElements = getStripePaymentElementsInstance();

    isStripeElementSubmitInProgress = true;

    if (!paymentElements || typeof paymentElements.submit !== 'function') {
        stripeCheckoutLog('handleStripePaymentElementSubmitOrder:missing-elements', {
            hasWindowElements: !!window.stripePaymentElements,
            hasLocalElements: !!stripeElements.paymentElement
        });
        isStripeElementSubmitInProgress = false;
        window.location.replace(document.getElementById('billingPageUrl').value);
        return;
    }

    window.stripePaymentElements = paymentElements;

    $('body').trigger('checkout:disableButton', '.next-step-button button');
    $.spinner().start();

    function finishPeSubmit(result) {
        if (result && result.error && !isIgnorablePeSubmitError(result.error)) {
            isStripeElementSubmitInProgress = false;
            $.spinner().stop();
            window.location.replace(document.getElementById('billingPageUrl').value);
            return;
        }

        markStripePaymentElementSubmitValidated();
        proceedStripePaymentElementConfirmationToken(paymentElements);
    }

    // Review Order already validated Link/wallet via elements.submit().
    if (stripePaymentElementSubmitValidated
            && (window.stripePaymentElementComplete === true
                || window.stripePaymentElementEmpty === false
                || isWalletOrApmPaymentElementType(window.stripePaymentElementType))) {
        proceedStripePaymentElementConfirmationToken(paymentElements);
        return;
    }

    paymentElements.submit().then(finishPeSubmit).catch(function (err) {
        if (isIgnorablePeSubmitError(err)) {
            markStripePaymentElementSubmitValidated();
            proceedStripePaymentElementConfirmationToken(paymentElements);
            return;
        }

        isStripeElementSubmitInProgress = false;
        $.spinner().stop();
        window.location.replace(document.getElementById('billingPageUrl').value);
    });
}

function getCheckoutPhoneForStripe() {
    var phoneSelectors = [
        '#dwfrm_billing input[name$="_phone"]',
        '.shipping-phone input[name$="_phone"]',
        'input[name$="_phone"]',
        '#phoneNumber',
        'input[name="phoneNumber"]'
    ];
    var phone = '';

    for (var i = 0; i < phoneSelectors.length; i++) {
        var node = document.querySelector(phoneSelectors[i]);
        if (node && node.value && String(node.value).trim()) {
            phone = String(node.value).trim();
            break;
        }
    }

    return phone;
}

function getBillingDetails(ownerEmail) {
    if (!ownerEmail && $('.customer-summary-email').length && $('.customer-summary-email').text() && $('.customer-summary-email').text() !== 'null') {
        ownerEmail = $('.customer-summary-email').text();
    } else {
        ownerEmail = document.querySelector('#dwfrm_billing input[name$="_email"]')
            ? document.querySelector('#dwfrm_billing input[name$="_email"]').value
            : document.querySelector('input[name$="_email"]').value;
    }

    return {
        billingDetails: {
            email: ownerEmail,
            name: (document.querySelector('#dwfrm_billing input[name$="_firstName"]') && document.querySelector('#dwfrm_billing input[name$="_lastName"]')) ? document.querySelector('#dwfrm_billing input[name$="_firstName"]').value + ' ' + document.querySelector('#dwfrm_billing input[name$="_lastName"]').value : '',
            phone: getCheckoutPhoneForStripe(),
            address: {
                postal_code: document.querySelector('#dwfrm_billing input[name$="_postalCode"]') ? document.querySelector('#dwfrm_billing input[name$="_postalCode"]').value : '',
                country: document.querySelector('#dwfrm_billing select[name$="_country"]') ? document.querySelector('#dwfrm_billing select[name$="_country"]').value : '',
                state: document.querySelector('#dwfrm_billing select[name$="_stateCode"]') ? document.querySelector('#dwfrm_billing select[name$="_stateCode"]').value : '',
                city: document.querySelector('#dwfrm_billing input[name$="_city"]') ? document.querySelector('#dwfrm_billing input[name$="_city"]').value : '',
                line1: document.querySelector('.billing-address input[name$="_address1"]') ? document.querySelector('.billing-address input[name$="_address1"]').value : '',
                line2: document.querySelector('.billing-address input[name$="_address2"]') ? document.querySelector('.billing-address input[name$="_address2"]').value : ''
            }
        }
    };
}

function initStripeElement(customerEmail, scope) {
    var stripeCollectBillingDetailsOnPaymentElement = getInputValueById('stripeCollectBillingDetailsOnPaymentElement');

    stripeCheckoutLog('initStripeElement:start', {
        scope: scope,
        customerEmail: customerEmail,
        hasExistingInstance: !!window[STRIPE_CONSTANTS[scope].instanceName],
        hasElementsObject: !!window[STRIPE_CONSTANTS[scope].elementsName],
        selector: STRIPE_CONSTANTS[scope].ismlElementID,
        collectBillingDetails: stripeCollectBillingDetailsOnPaymentElement
    });

    if (window[STRIPE_CONSTANTS[scope].instanceName]) {
        stripeCheckoutLog('initStripeElement:destroy-existing', {
            scope: scope,
            instanceName: STRIPE_CONSTANTS[scope].instanceName
        });
        window[STRIPE_CONSTANTS[scope].instanceName].destroy();
    }

    if (window[STRIPE_CONSTANTS[scope].elementsName]) {
        window[STRIPE_CONSTANTS[scope].instanceName] = window[STRIPE_CONSTANTS[scope].elementsName].create('payment', {
            defaultValues: getBillingDetails(customerEmail),
            fields: {
                billingDetails: stripeCollectBillingDetailsOnPaymentElement
            }
        });
        window[STRIPE_CONSTANTS[scope].instanceName].mount(STRIPE_CONSTANTS[scope].ismlElementID);
        stripeCheckoutLog('initStripeElement:mounted', {
            scope: scope,
            selector: STRIPE_CONSTANTS[scope].ismlElementID
        });
    } else {
        stripeCheckoutLog('initStripeElement:skip-no-elements-object', {
            scope: scope,
            expectedElementsName: STRIPE_CONSTANTS[scope].elementsName
        });
    }
}

// function initAvailableElements() {
//     stripeCheckoutLog('initAvailableElements:start', {
//         hasPaymentElementNode: $('#payment-element').length > 0,
//         hasBankTransferElementNode: $('#stripe-bank-transfer-element').length > 0
//     });

//     if ($('#payment-element').length) {
//         initStripeElement(null, 'paymentElement');
//     }

//     if ($('#stripe-bank-transfer-element').length) {
//         initStripeElement(null, 'bankTransferElement');
//     }
// }

// function initNewStripeIntent(scope) {
//     var optionsElementId = scope === 'paymentElement' ? 'getPaymentElementOptions' : 'getBankTransferElementOptions';
//     var optionsElement = document.getElementById(optionsElementId);
//     var getElementOptionsURL = optionsElement ? optionsElement.value : null;

//     stripeCheckoutLog('initNewStripeIntent:start', {
//         scope: scope,
//         optionsElementId: optionsElementId,
//         hasOptionsElement: !!optionsElement,
//         url: getElementOptionsURL
//     });

//     if (!getElementOptionsURL) {
//         stripeCheckoutLog('initNewStripeIntent:abort-missing-url', {
//             scope: scope,
//             reason: 'Hidden input for options URL is missing or empty',
//             expectedElementId: optionsElementId
//         });
//         return;
//     }

//     $.ajax({
//         url: getElementOptionsURL,
//         method: 'GET',
//         dataType: 'json',
//     }).done(function (response) {
//         stripeCheckoutLog('initNewStripeIntent:success', {
//             scope: scope,
//             hasResponse: !!response,
//             hasElementOptions: !!(response && response.elementOptions),
//             customerEmail: response ? response.customerEmail : null
//         });

//         if (!(response && response.elementOptions)) {
//             stripeCheckoutLog('initNewStripeIntent:abort-invalid-response', {
//                 scope: scope,
//                 response: response
//             });
//             return;
//         }

//         window[STRIPE_CONSTANTS[scope].elementsName] = stripe.elements(response.elementOptions);
//         initStripeElement(response.customerEmail, scope);
//     }).fail(function (jqXHR, textStatus, errorThrown) {
//         stripeCheckoutLog('initNewStripeIntent:error', {
//             scope: scope,
//             url: getElementOptionsURL,
//             textStatus: textStatus,
//             errorThrown: errorThrown,
//             status: jqXHR ? jqXHR.status : null,
//             responseText: jqXHR ? jqXHR.responseText : null
//         });
//     });
// }

// /* Stripe Payment Element */
// ready(() => {
//     var hasPaymentElementNode = $('#payment-element').length > 0;
//     var hasBankTransferNode = $('#stripe-bank-transfer-element').length > 0;
//     var isPaymentSummaryVisible = $('.payment-summary').is(':visible');

//     stripeCheckoutLog('ready:init-check', {
//         hasPaymentElementNode: hasPaymentElementNode,
//         hasBankTransferNode: hasBankTransferNode,
//         isPaymentSummaryVisible: isPaymentSummaryVisible,
//         shouldInitOnLoad: !isPaymentSummaryVisible
//     });

//     if (hasPaymentElementNode && !isPaymentSummaryVisible) {
//         stripeCheckoutLog('ready:init-payment-element', {
//             reason: 'Payment element exists and payment summary is not visible'
//         });
//         initNewStripeIntent('paymentElement');
//     } else {
//         stripeCheckoutLog('ready:skip-payment-element', {
//             hasPaymentElementNode: hasPaymentElementNode,
//             isPaymentSummaryVisible: isPaymentSummaryVisible
//         });
//     }

//     if (hasBankTransferNode && !isPaymentSummaryVisible) {
//         stripeCheckoutLog('ready:init-bank-transfer', {
//             reason: 'Bank transfer element exists and payment summary is not visible'
//         });
//         initNewStripeIntent('bankTransferElement');
//     } else {
//         stripeCheckoutLog('ready:skip-bank-transfer', {
//             hasBankTransferNode: hasBankTransferNode,
//             isPaymentSummaryVisible: isPaymentSummaryVisible
//         });
//     }
// });


var stripeElements = {};
var stripePaymentElement = {};
var stripeBankTransferElement = {};
var isStripeElementSubmitInProgress = false;


/**
 * Initialize Stripe Elements on checkout load
 */
function initAvailableElements() {

    if (isStripeElementSubmitInProgress) {
        stripeCheckoutLog(
            'initAvailableElements:skip-submit-in-progress'
        );

        return;
    }

    var hasPaymentElement =
        $('#payment-element').length > 0;

    var hasBankTransferElement =
        $('#stripe-bank-transfer-element').length > 0;


    stripeCheckoutLog(
        'initAvailableElements',
        {
            hasPaymentElement: hasPaymentElement,
            hasBankTransferElement: hasBankTransferElement
        }
    );


    if (hasPaymentElement) {

        initializeStripeElement(
            'paymentElement'
        );

    }


    if (hasBankTransferElement) {

        initializeStripeElement(
            'bankTransferElement'
        );

    }

}



/**
 * Get Stripe configuration from SFCC
 */
function initializeStripeElement(scope) {

    if (!stripe) {
        stripeCheckoutLog('initializeStripeElement:skip-no-stripe', {
            scope: scope,
            hasStripeFunction: typeof Stripe === 'function',
            hasStripePublicKey: !!stripePublicKey
        });

        return;
    }


    var config =
        STRIPE_CONSTANTS[scope];


    var optionsElement =
        document.getElementById(
            config.optionsUrlElement
        );


    if (!optionsElement || !optionsElement.value) {


        stripeCheckoutLog(
            'initializeStripeElement missing URL',
            {
                scope:scope
            }
        );


        return;

    }



    stripeCheckoutLog(
        'Requesting Stripe Options',
        {
            scope:scope,
            url:optionsElement.value
        }
    );



    $.ajax({

        url: optionsElement.value,

        method:'GET',

        dataType:'json'


    })


    .done(function(response){



        stripeCheckoutLog(
            'Stripe Options Response',
            {
                scope:scope,
                response:response
            }
        );



        if (!response ||
            !response.elementOptions) {


            stripeCheckoutLog(
                'Invalid Stripe Response',
                response
            );


            return;

        }

        if (scope === 'paymentElement' && stripePaymentElement && typeof stripePaymentElement.destroy === 'function') {
            try {
                stripePaymentElement.destroy();
            } catch (e) {
                stripeCheckoutLog('Payment Element destroy failed', { error: e && e.message ? e.message : e });
            }
            stripePaymentElement = null;
            resetStripePaymentElementSubmitValidated();
        }

        if (scope === 'bankTransferElement' && stripeBankTransferElement && typeof stripeBankTransferElement.destroy === 'function') {
            try {
                stripeBankTransferElement.destroy();
            } catch (e) {
                stripeCheckoutLog('Bank Transfer Element destroy failed', { error: e && e.message ? e.message : e });
            }
            stripeBankTransferElement = null;
        }




        /**
         * Create Stripe Elements
         *
         * This DOES NOT create PaymentIntent
         */
        stripeElements[scope] =
            stripe.elements(
                response.elementOptions
            );

        window[config.elementsName] = stripeElements[scope];




        mountStripeElement(scope);



    })


    .fail(function(xhr,status,error){


        stripeCheckoutLog(
            'Stripe Options API Failed',
            {
                status:status,
                error:error,
                response:xhr.responseText
            }
        );


    });


}



/**
 * Mount Stripe UI components
 */
function mountStripeElement(scope){


    var elements =
        stripeElements[scope];



    if (!elements) {


        stripeCheckoutLog(
            'No Stripe Elements Instance',
            {
                scope:scope
            }
        );


        return;

    }





    if(scope === 'paymentElement'){

        window.stripePaymentElementComplete = false;
        window.stripePaymentElementEmpty = true;
        window.stripePaymentElementType = '';
        resetStripePaymentElementSubmitValidated();

        var peBillingDetails = getBillingDetails(null);
        // Email/phone are already collected on checkout. Leaving PE fields at Stripe "auto"
        // marks them required for Link/Klarna and blocks Review Order. Hide them in PE and
        // supply checkout billing_details at confirm/createConfirmationToken time instead.
        var peCreateOptions = {
            layout: {
                type: 'accordion'
            },
            defaultValues: peBillingDetails,
            fields: {
                billingDetails: {
                    name: 'auto',
                    email: 'never',
                    phone: 'never',
                    address: 'if_required'
                }
            },
            walletOptions: {
                emailRequired: false,
                phoneNumberRequired: false
            }
        };

        stripePaymentElement =
            elements.create(
                'payment',
                peCreateOptions
            );



        stripePaymentElement.mount(
            '#payment-element'
        );

        if (stripePaymentElement && typeof stripePaymentElement.on === 'function') {
            stripePaymentElement.on('change', function (event) {
                window.stripePaymentElementComplete = !!(event && event.complete);
                window.stripePaymentElementEmpty = !!(event && event.empty);
                window.stripePaymentElementType = (event && event.value && event.value.type)
                    ? event.value.type
                    : '';
            });
        }

        window.stripePaymentElements = elements;
        window.stripePaymentElementInstance = stripePaymentElement;



        stripeCheckoutLog(
            'Payment Element Mounted'
        );


    }





    if(scope === 'bankTransferElement'){


        stripeBankTransferElement =
            elements.create(
                'customerBalance'
            );



        stripeBankTransferElement.mount(
            '#stripe-bank-transfer-element'
        );

        window.stripeBankTransferElements = elements;
        window.stripeBankTransferElementInstance = stripeBankTransferElement;


        stripeCheckoutLog(
            'Bank Transfer Mounted'
        );


    }


}





/**
 * Checkout page events
 */
$(document).ready(function(){



    stripeCheckoutLog(
        'Stripe Checkout JS Loaded'
    );



    /**
     * Billing page load
     */
    if($('#payment-element').length){


        initAvailableElements();


    }



    /**
     * Reinitialize after shipping changes
     */
    $('.submit-shipping')
        .on(
            'click',
            function(){

                setTimeout(
                    function(){

                        initAvailableElements();

                    },
                    500
                );

            }
        );





    /**
     * Customer information changes
     */
    $(
        '#dwfrm_billing input[name$="_email"],' +
        '#dwfrm_billing input[name$="_firstName"],' +
        '#dwfrm_billing input[name$="_lastName"],' +
        '#dwfrm_billing input[name$="_phone"],' +
        '#dwfrm_billing input[name$="_postalCode"],' +
        '#dwfrm_billing select[name$="_country"]'
    )
    .on(
        'change',
        function(){

            initAvailableElements();

        }
    );



});

// Update stored order amount on shipping method change
$('body').on('checkout:updateCheckoutView', function () {
    var getStripeOrderItemsURLElement = document.getElementById('getStripeOrderItemsURL');

    if (!getStripeOrderItemsURLElement || !getStripeOrderItemsURLElement.value) {
        stripeCheckoutLog('event:checkout:updateCheckoutView:skip-missing-url');
        return;
    }

    stripeCheckoutLog('event:checkout:updateCheckoutView', {
        getStripeOrderItemsURL: getStripeOrderItemsURLElement.value
    });

    $.ajax({
        url: getStripeOrderItemsURLElement.value,
        method: 'GET',
        dataType: 'json'
    }).done(function (json) {
        var stripeOrderAmountInput = document.getElementById('stripe_order_amount');

        stripeCheckoutLog('event:checkout:updateCheckoutView:response', {
            currentAmountInputValue: stripeOrderAmountInput ? stripeOrderAmountInput.value : null,
            newAmount: json ? json.amount : null,
            hasPaymentElementNode: $('#payment-element').length > 0,
            hasBankTransferNode: $('#stripe-bank-transfer-element').length > 0
        });

        // check if order amount has been changed
        // eslint-disable-next-line
        if (stripeOrderAmountInput && stripeOrderAmountInput.value != json.amount) {
            if ($('#payment-element').length) {
                initializeStripeElement('paymentElement');
            }

            if ($('#stripe-bank-transfer-element').length) {
                initializeStripeElement('bankTransferElement');
            }

            stripeOrderAmountInput.value = json.amount;
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        stripeCheckoutLog('event:checkout:updateCheckoutView:error', {
            textStatus: textStatus,
            errorThrown: errorThrown,
            status: jqXHR ? jqXHR.status : null,
            responseText: jqXHR ? jqXHR.responseText : null
        });
    });
});

ready(() => {
    var submitShippingButton = document.querySelector('.submit-shipping');

    // eslint-disable-next-line no-unused-vars
    if (submitShippingButton) submitShippingButton.addEventListener('click', (e) => {
        initAvailableElements();
    });

    if (document.querySelector('#dwfrm_billing input[name$="_email"]')) {
        document.querySelector('#dwfrm_billing input[name$="_email"]').addEventListener('change', initAvailableElements);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_firstName"]')) {
        document.querySelector('#dwfrm_billing input[name$="_firstName"]').addEventListener('change', initAvailableElements);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_lastName"]')) {
        document.querySelector('#dwfrm_billing input[name$="_lastName"]').addEventListener('change', initAvailableElements);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_phone"]')) {
        document.querySelector('#dwfrm_billing input[name$="_phone"]').addEventListener('change', initAvailableElements);
    }

    if (document.querySelector('#dwfrm_billing input[name$="_postalCode"]')) {
        document.querySelector('#dwfrm_billing input[name$="_postalCode"]').addEventListener('change', initAvailableElements);
    }

    var countryElement = document.querySelector('#dwfrm_billing select[name$="_country"]')
        || document.querySelector('#dwfrm_billing input[name$="_country"]');

    if (countryElement) {
        countryElement.addEventListener('change', initAvailableElements);
    }
});

function handleStripeRequiresActionResponse(response) {
        // Use Stripe.js to handle required card action
    stripe.handleNextAction({clientSecret: response.payment_intent_client_secret}).then(function (result) {
        if (result.error) {
            stripeFailOrder();
            alert(result.error.message);
            window.location.replace(document.getElementById('billingPageUrl').value);
        } else {
            // The card action has been handled
            // The PaymentIntent can be confirmed again on the server
            $.ajax({
                url: document.getElementById('cardPaymentHandleRequiresActionURL').value,
                method: 'POST',
                dataType: 'json',
                data: {
                    csrf_token: $('[name="csrf_token"]').val()
                }
            }).done(function (json) {
                if (json.error) {
                    stripeFailOrder();
                    if (json.error.message) {
                        alert(json.error.message);
                    }
                    window.location.replace(document.getElementById('billingPageUrl').value);
                } else {
                    forceSubmit = true;
                    redirectToCheckoutSummaryPage();
                }
            }).fail(function (msg) {
                stripeFailOrder();
                if (msg.responseJSON.redirectUrl) {
                    window.location.href = msg.responseJSON.redirectUrl;
                } else {
                    alert(msg);
                }
            });
        }
    });
}

// eslint-disable-next-line
function handleStripeCardSubmitOrder() {
    $('body').trigger('checkout:disableButton', '.next-step-button button');
    $.spinner().start();

    $.ajax({
        url: document.getElementById('cardPaymentSubmitOrderURL').value,
        method: 'POST',
        data: {
            csrf_token: $('[name="csrf_token"]').val()
        },
        success: function (data) {
            // enable the placeOrder button here
            $('body').trigger('checkout:enableButton', '.next-step-button button');

            if (data.error) {
                if (data.errorMessage) {
                    alert(data.errorMessage);
                }
                window.location.replace(document.getElementById('billingPageUrl').value);
            } else {
                window.localStorage.setItem('stripe_pe_continueurl', data.continueUrl);
                window.localStorage.setItem('stripe_pe_orderid', data.orderID);
                window.localStorage.setItem('stripe_pe_ordertoken', data.orderToken);

                if (data.requires_action) {
                    handleStripeRequiresActionResponse(data);
                } else {
                    redirectToCheckoutSummaryPage();
                }
            }
        },
        error: function () {
            // enable the placeOrder button here
            $('body').trigger('checkout:enableButton', $('.next-step-button button'));
        }
    });
}

// Intercept ONLY the final Place Order button (#submit-order / value=place-order).
// Never intercept Review Order (button.submit-payment) — that button often also has
// class "place-order" when skip-review / commerce-payments is on, and catching it
// caused CheckoutServices-PlaceOrder instead of CheckoutServices-SubmitPayment for
// saved Stripe cards (first visit and after Edit Payment).
document.addEventListener('click', function (event) {
    var placeOrderBtn = event.target && event.target.closest
        ? event.target.closest('button.place-order, button[value="place-order"]')
        : null;

    if (!placeOrderBtn) {
        return;
    }

    // Review Order must always go through SFRA SubmitPayment.
    if (placeOrderBtn.classList.contains('submit-payment')
        || placeOrderBtn.getAttribute('value') === 'submit-payment') {
        return;
    }

    var selectedPaymentMethod = resolvePlaceOrderPaymentMethod();
    var isStripeSelectedMethod = isStripeCheckoutPaymentMethod(selectedPaymentMethod);

    setBillingFormPaymentMethod(selectedPaymentMethod);

    if (isStripeSelectedMethod && isZeroStripeOrderAmount()) {
        clearStripePayloadData();
        window.localStorage.setItem('stripe_payment_method', '');
        forceSubmit = false;
        isStripeElementSubmitInProgress = false;
        return;
    }

    if (!isStripeSelectedMethod) {
        window.localStorage.setItem('stripe_payment_method', '');
        return;
    }

    window.localStorage.setItem('stripe_payment_method', selectedPaymentMethod);

    event.preventDefault();
    event.stopImmediatePropagation();

    if (isStripeElementSubmitInProgress) {
        return;
    }

    forceSubmit = false;

    if (selectedPaymentMethod === 'CREDIT_CARD' && isSavedCard()) {
        syncCheckedSavedCardToHiddenInputs();
    }

    if (selectedPaymentMethod === 'STRIPE_PAYMENT_ELEMENT') {
        handleStripePaymentElementSubmitOrder();
        return;
    }

    if (selectedPaymentMethod === 'BANK_TRANSFER') {
        handleStripeBankTransferSubmitOrder();
        return;
    }

    handleStripeCardSubmitOrder();
}, true);
