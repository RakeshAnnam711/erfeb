'use strict';

//This file was added to override base to support gift certificates

var base = require('base/checkout/summary');

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
base.updateTotals = function updateTotals(totals) {
    $('.shipping-total-cost').text(totals.totalShippingCost);
    $('.tax-total').text(totals.totalTax);
    if (totals.totalBasePrice) {
        $('.sub-total').text(totals.totalBasePrice.formatted);
    } else {
        $('.sub-total').text(totals.subTotal);
    }
    $('.grand-total-sum').text(totals.grandTotalLessGiftCertificatePaymentInstrumentsFormatted);
    $('.grand-total-sum').attr('data-grand-total-sum', totals.grandTotalLessGiftCertificatePaymentInstrumentsValue);
    $('.grand-total-sum').data('grand-total-sum', totals.grandTotalLessGiftCertificatePaymentInstrumentsValue);

    if (totals.giftCertificatePaymentInstrumentsLabel) {
        $('.giftcertificate-discount').removeClass('d-none');
        $('.giftcertificate-discount-label').text(totals.giftCertificatePaymentInstrumentsLabel);
        $('.giftcertificate-discount-total').text('- ' + totals.giftCertificatePaymentInstrumentsTotalFormatted);
    } else {
        $('.giftcertificate-discount').addClass('d-none');
    }

    if (totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').text('- ' +
            totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }
}

/**
 * updates the order product shipping summary for an order model
 * @param {Object} order - the order model
 */
base.updateOrderProductSummaryInformation = function updateOrderProductSummaryInformation(order) {
    if (order.shipping && order.shipping.length) {
        var $productSummary = $('<div />');
        var shipmentCounter = 0;
        order.shipping.forEach(function (shipping) {
            if (order.shipping.length > 1 && shipmentCounter > 0) {
                $productSummary.append('<div class="shipment-block">');
            }

            shipping.giftCertificateLineItems.items.forEach(function (lineItem) {
                var pli = $('[data-product-line-item=' + lineItem.UUID + ']');
                $productSummary.append(pli);
            });
            shipping.productLineItems.items.forEach(function (lineItem) {
                var pli = $('[data-product-line-item=' + lineItem.UUID + ']');
                $productSummary.append(pli);
            });

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

            if (shipping.productLineItems.physicalItemsCount > 1) {
                $('#checkout-main h5 > span').each(i => $(i).text(' - ' + shipping.productLineItems.physicalItemsCount.toFixed(0) + ' '
                    + order.resources.items));
            } else {
                $('#checkout-main h5 > span').each(i => $(i).text(''));
            }

            var stateRequiredAttr = $('#shippingState').attr('required');
            var isRequired = stateRequiredAttr !== undefined && stateRequiredAttr !== false;
            var stateExists = (shipping.shippingAddress && shipping.shippingAddress.stateCode)
                ? shipping.shippingAddress.stateCode
                : false;
            var stateBoolean = false;
            if ((isRequired && stateExists) || (!isRequired)) {
                stateBoolean = true;
            }

            var shippingForm = $('.multi-shipping input[name="shipmentUUID"][value="' + shipping.UUID + '"]').parent();

            if (shipping.shippingAddress
                && shipping.shippingAddress.firstName
                && shipping.shippingAddress.address1
                && shipping.shippingAddress.city
                && stateBoolean
                && shipping.shippingAddress.countryCode
                && (shipping.shippingAddress.phone || (shipping.productLineItems && shipping.productLineItems.items && shipping.productLineItems.items[0] && shipping.productLineItems.items[0].fromStoreId))) {
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

                shippingForm.find('.ship-to-message').text('');
            } else {
                shippingForm.find('.ship-to-message').text(order.resources.addressIncomplete);
            }

            if (shipping.isGift) {
                $('.gift-message-summary', tmpl).text(shipping.giftMessage);
            } else {
                $('.gift-summary', tmpl).addClass('d-none');
            }

            // checking h5 title shipping to or pickup
            var $shippingAddressLabel = $('.shipping-header-text', tmpl);
            $('body').trigger('shipping:updateAddressLabelText',
                {selectedShippingMethod: selectedMethod, resources: order.resources, shippingAddressLabel: $shippingAddressLabel});

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

            var $shippingSummary = $('.multi-shipping', tmpl);
            $shippingSummary.attr('data-shipment-summary', shipping.UUID);
            $productSummary.append(tmpl.html());

            if (order.shipping.length > 1 && shipmentCounter > 0) {
                $productSummary.append('</div>');
            }
            shipmentCounter++;
        });

        $('.product-summary-block').html($productSummary.html());

        // Also update the line item prices, as they might have been altered
        $('.grand-total-price').text(order.totals.subTotal);
        order.items.items.forEach(function (item) {
            if (item.priceTotal && item.priceTotal.price) {
                $('.item-total-' + item.UUID).empty().append(item.priceTotal.price);
            }
        });
    }
}

module.exports = base;
