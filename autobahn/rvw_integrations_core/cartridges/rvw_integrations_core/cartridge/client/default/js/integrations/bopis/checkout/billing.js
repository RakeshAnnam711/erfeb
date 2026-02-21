'use strict';

var addressHelpers = require('core/checkout/address');

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;
    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
        // Add New Address option
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order,
            { type: 'billing' }));

        // Separator -
        $billingAddressSelector.append(
            addressHelpers.methods.optionValueForAddress(order.resources.shippingAddresses, false, order, { type: 'billing' })
        );

        shippings.forEach(function (aShipping) {
            if (!aShipping.selectedShippingMethod || !aShipping.selectedShippingMethod.storePickupEnabled) {
                var isSelected = order.billing.matchingAddressId === aShipping.UUID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Shipping Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress(aShipping, isSelected, order, { type: 'billing' })
                );
            }
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Customer Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress({
                        UUID: 'ab_' + address.ID,
                        shippingAddress: address
                    }, isSelected, order, { type: 'billing' })
                );
            });
        }
    }

    if ((hasSelectedAddress
        || (!order.billing.matchingAddressId && order.billing.billingAddress.address))
        && order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
        $(form).attr('data-address-mode', 'edit');
    } else {
        // show
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
}

module.exports = {
    methods : {
        updateBillingAddressSelector : updateBillingAddressSelector
    }
};
