'use strict';

var Cleave = require('cleave.js').default;
var base = require('base/components/cleave');

base.handleCreditCardNumber = function (cardFieldSelector, cardTypeSelector) {
    if ($(cardFieldSelector).length && $(cardTypeSelector).length) {
        var cleave = new Cleave(cardFieldSelector, {
            creditCard: true,
            onCreditCardTypeChanged: function (type) {
                window.ccType = type;
                var creditCardTypes = {
                    visa: 'Visa',
                    mastercard: 'MasterCard',
                    amex: 'Amex',
                    discover: 'Discover',
                    maestro: 'Maestro',
                    jcb: 'JCB',
                    diners: 'DinersClub',
                    unknown: 'Unknown'
                };
                var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf(type) > -1
                    ? type
                    : 'unknown'];
                $(cardTypeSelector).val(cardType);
                $('.card-number-wrapper').attr('data-type', type);
                if (type === 'visa' || type === 'mastercard' || type === 'discover') {
                    $('#securityCode').attr('maxlength', 3);
                    $('#securityCode').attr('minlength', 3);
                } else {
                    $('#securityCode').attr('maxlength', 4);
                    $('#securityCode').attr('minlength', 4);
                }
            }
        });

        if ($('li[data-method-id="CREDIT_CARD"]').attr('data-sa-type') != 'SA_FLEX') {
            $(cardFieldSelector).data('cleave', cleave);
        }
    }
};

base.serializeData =  function (form) {
    var serializedArray = form.serializeArray();
    var $cardNumberField = $('#cardNumber');
    var cardNumberCleave = $cardNumberField.data('cleave');

    serializedArray.forEach(function (item) {
        if (item.name.indexOf('cardNumber') > -1) {
            if ($('li[data-method-id="CREDIT_CARD"]').attr('data-sa-type') !== 'SA_FLEX') {
                if (cardNumberCleave && typeof cardNumberCleave.getRawValue === 'function') {
                    item.value = cardNumberCleave.getRawValue(); // eslint-disable-line
                } else if ($cardNumberField.length) {
                    item.value = ($cardNumberField.val() || '').replace(/\s+/g, '');
                }
            }
        }
    });

    return $.param(serializedArray);
};

module.exports = base;
