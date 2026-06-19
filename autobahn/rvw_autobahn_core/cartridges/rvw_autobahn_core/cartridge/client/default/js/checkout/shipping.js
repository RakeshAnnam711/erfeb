'use strict';

var addressHelpers = require('./address');

var debounce = require('lodash/debounce');
var baseShipping = require('base/checkout/shipping');

function updateShippingAddressFormValues(shipping) {
    var addressObject = $.extend({}, shipping.shippingAddress);

    if (!addressObject) {
        addressObject = {
            firstName: null,
            lastName: null,
            address1: null,
            address2: null,
            city: null,
            postalCode: null,
            stateCode: null,
            countryCode: null,
            phone: null
        };
    }

    addressObject.isGift = shipping.isGift;
    addressObject.giftMessage = shipping.giftMessage;

    $('input[value=' + shipping.UUID + ']').each(function (formIndex, el) {
        var form = el.form;
        if (!form) return;
        var countryCode = addressObject.countryCode;

        $('input[name$=_firstName]', form).val(addressObject.firstName ? addressObject.firstName : $('input[name$=_firstName]', form).val());
        $('input[name$=_lastName]', form).val(addressObject.lastName ? addressObject.lastName : $('input[name$=_lastName]', form).val());
        $('input[name$=_address1]', form).val(addressObject.address1 ? addressObject.address1 : $('input[name$=_address1]', form).val());
        $('input[name$=_address2]', form).val(addressObject.address2 ? addressObject.address2 : $('input[name$=_address2]', form).val());
        $('input[name$=_city]', form).val(addressObject.city ? addressObject.city : $('input[name$=_city]', form).val());
        $('input[name$=_postalCode]', form).val(addressObject.postalCode ? addressObject.postalCode : $('input[name$=_postalCode]', form).val());
        $('select[name$=_stateCode],input[name$=_stateCode]', form)
            .val(addressObject.stateCode ? addressObject.stateCode : $('select[name$=_stateCode],input[name$=_stateCode]', form).val());

        if (countryCode && typeof countryCode === 'object') {
            $('select[name$=_country]', form).val(addressObject.countryCode.value ? addressObject.countryCode.value : $('select[name$=_country]', form).val());
        }

        $('input[name$=_phone]', form).val(addressObject.phone ? addressObject.phone : $('input[name$=_phone]', form).val());

        $('textarea[name$=_giftMessage]', form).val(addressObject.giftMessage ? addressObject.giftMessage : $('textarea[name$=_giftMessage]', form).val());
    });

    $('body').trigger('shipping:updateShippingAddressFormValues', { shipping: shipping });
}

/**
 * Update the read-only portion of the shipment display (per PLI)
 * @param {Object} productLineItem - the productLineItem model
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 * @param {Object} [options] - options for updating PLI summary info
 * @param {Object} [options.keepOpen] - if true, prevent changing PLI view mode to 'view'
 */
function updatePLIShippingSummaryInformation(productLineItem, shipping, order, options) {
    var $pli = $('input[value=' + productLineItem.UUID + ']');
    var form = $pli && $pli.length > 0 ? $pli[0].form : null;

    if (!form) return;

    var $viewBlock = $('.view-address-block', form);

    var address = shipping.shippingAddress || {};
    var selectedMethod = shipping.selectedShippingMethod;

    var nameLine = address.firstName ? address.firstName + ' ' : '';
    if (address.lastName) nameLine += address.lastName;

    var address1Line = address.address1;
    var address2Line = address.address2;

    var phoneLine = address.phone;

    var shippingCost = selectedMethod ? selectedMethod.shippingCost : '';
    var methodNameLine = selectedMethod ? selectedMethod.displayName : '';
    var methodArrivalTime = selectedMethod && selectedMethod.estimatedArrivalTime
        ? '(' + selectedMethod.estimatedArrivalTime + ')'
        : '';

    var tmpl = $('#pli-shipping-summary-template').clone();

    $('.ship-to-name', tmpl).text(nameLine);
    $('.ship-to-address1', tmpl).text(address1Line);
    $('.ship-to-address2', tmpl).text(address2Line);
    $('.ship-to-city', tmpl).text(address.city);
    if (address.stateCode) {
        $('.ship-to-st', tmpl).text(address.stateCode);
    }
    $('.ship-to-zip', tmpl).text(address.postalCode);
    $('.ship-to-phone', tmpl).text(phoneLine);

    if (!address2Line) {
        $('.ship-to-address2', tmpl).hide();
    }

    if (!phoneLine) {
        $('.ship-to-phone', tmpl).hide();
    }

    if (shipping.selectedShippingMethod) {
        $('.display-name', tmpl).text(methodNameLine);
        $('.arrival-time', tmpl).text(methodArrivalTime);
        $('.price', tmpl).text(shippingCost);
    }

    if (shipping.isGift) {
        $('.gift-message-summary', tmpl).text(shipping.giftMessage);
        var shipment = $('.gift-message-' + shipping.UUID);
        $(shipment).val(shipping.giftMessage);
    } else {
        $('.gift-summary', tmpl).addClass('d-none');
    }
    // checking h5 title shipping to or pickup
    var $shippingAddressLabel = $('.shipping-header-text', tmpl);
    $('body').trigger('shipping:updateAddressLabelText',
        { selectedShippingMethod: selectedMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel });

    if (shipping.selectedShippingMethod) {
        var sliCounter = 0;
        var sliArea = $('.js-shipping-line-items', tmpl);
        var newHtml = '<h5>' + order.resources.shippingMethod + '<span>' + (shipping.productLineItems.physicalItemsCount > 1 ? ' - ' + shipping.productLineItems.physicalItemsCount.toFixed(0) + ' '
            + order.resources.items : '') + '</span></h5>';
        shipping.shippingLineItems.forEach(function (sli) {
            newHtml +=
                '<div class="leading-lines m-0 d-flex justify-content-between shipping-items">' +
                    '<p class="order-receipt-label"><span>' + (sliCounter++ === 0 ? methodNameLine + ' ' + methodArrivalTime : sli.lineItemText) + '</span></p>' +
                    '<p><span class="shipping-lineitem-cost">' + sli.adjustedPrice.formatted + '</span></p>' +
                '</div>';
        });

        sliArea.html(newHtml);
    }

    $viewBlock.html(tmpl.html());

    $('body').trigger('shipping:updatePLIShippingSummaryInformation', {
        productLineItem: productLineItem,
        shipping: shipping,
        order: order,
        options: options
    });
}

baseShipping.selectSingleShipping =  function () {
    $('body').on('shipping:selectSingleShipping', function () {
        $('.single-shipping .shipping-address, .shipping-summary .single-shipping, .btn-enter-multi-ship').removeClass('d-none');
        $('.shipping-summary .multi-shipping').addClass('d-none');
        if ($('.multi-ship-action-buttons').length) {
            $('.multi-ship-action-buttons').each( (i, multiShipFormActions) => {
                $(multiShipFormActions).siblings('.shipping-address, .view-address-block').addClass('d-none');
                $(multiShipFormActions).children('*:not(.btn-enter-multi-ship)').addClass('d-none');
            })
        }
    });
};

baseShipping.selectMultiShipping =  function () {
    $('body').on('shipping:selectMultiShipping', function (e, data) {
        $('.multi-shipping .shipping-address, .single-shipping .shipping-address, .shipping-summary .single-shipping').addClass('d-none');
        $('.shipping-summary .multi-shipping').removeClass('d-none');
    });
};

baseShipping.selectSingleShipAddress = function () {
    $('.single-shipping .addressSelector').on('change', function () {
        var form = $(this).parents('form')[0];
        var selectedOption = $('option:selected', this);
        var attrs = selectedOption.data();
        var shipmentUUID = selectedOption[0].value;
        var originalUUID = $('input[name=shipmentUUID]', form).val();
        var element;
        Object.keys(attrs).forEach(function (attr) {
            element = attr === 'countryCode' ? 'country' : attr;
            if ((element === 'country' && shipmentUUID === 'new') || element === 'isGift') {
                // don't clear out the country dropdown or gift message field
            } else {
                $('[name$=' + element + ']', form).val(attrs[attr]);
            }
        });
        $('[name$=stateCode]', form).trigger('change');
        if (shipmentUUID === 'new') {
            $(form).attr('data-address-mode', 'new');
            $(form).find('.shipping-address-block').removeClass('d-none');
        } else if (shipmentUUID === originalUUID) {
            $(form).attr('data-address-mode', 'shipment');
        } else if (shipmentUUID.indexOf('ab_') === 0) {
            $(form).attr('data-address-mode', 'customer');
        } else {
            $(form).attr('data-address-mode', 'edit');
        }
    });
};

const updateShipping = (e) => {
    baseShipping.methods.updateShippingMethodList($(e.currentTarget.form));
};

/**
 * Update list of available shipping methods whenever user modifies shipping address details.
 * @param {jQuery} $shippingForm - current shipping form
 */
// delay for autocomplete!
baseShipping.methods.updateShippingMethodList = debounce(function ($shippingForm) {
    var $shippingMethodList = $shippingForm.find('.shipping-method-list');
    var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
    var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
    var url = $shippingMethodList.data('actionUrl');
    urlParams.shipmentUUID = shipmentUUID;

    var $xhr = $shippingForm.data('$xhr');

    $shippingForm.data('$xhr', $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: urlParams,
        beforeSend: function () {
            $xhr && $xhr.abort && $xhr.abort();
            $.spinner().start();
            // $shippingMethodList.spinner().start();
        },
        success: function (data) {
            if (data.error) {
                if (data.serverErrors && data.serverErrors.length) {
                    $.each(data.serverErrors, function (index, element) {
                        baseShipping.methods.createErrorNotification(element);
                    });
                } else if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                }
            } else {
                $('body').trigger('checkout:updateCheckoutView', {
                    order: data.order,
                    customer: data.customer,
                    options: {
                        keepOpen: true
                    }
                });
            }
        },
        complete: function () {
            // $shippingMethodList.spinner().stop();
            $.spinner().stop();
        }
    }));
}, 300);

baseShipping.updateShippingList = () => {
    $('select[name$="shippingAddress_addressFields_states_stateCode"]').on('change', updateShipping);
    $('input[name$="dwfrm_shipping_shippingAddress_addressFields_postalCode"]').on('blur', updateShipping);
}

baseShipping.methods.updateShippingAddressFormValues = updateShippingAddressFormValues;

baseShipping.methods.updatePLIShippingSummaryInformation = updatePLIShippingSummaryInformation;

module.exports = baseShipping;
