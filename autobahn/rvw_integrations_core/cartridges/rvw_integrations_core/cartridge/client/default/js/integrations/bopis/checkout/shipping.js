'use strict';

var addressHelpers = require('core/checkout/address');
var bopisShipping = require('core/checkout/shipping');

/**
 * updates the shipping address selector within shipping forms
 * @param {Object} productLineItem - the productLineItem model
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
bopisShipping.methods.updateShippingAddressSelector = function(productLineItem, shipping, order, customer) {
    var uuidEl = $('input[value=' + productLineItem.UUID + ']');
    var shippings = order.shipping;

    var form;
    var $shippingAddressSelector;
    var hasSelectedAddress = false;

    if (uuidEl && uuidEl.length > 0) {
        form = uuidEl[0].form;
        $shippingAddressSelector = $('.addressSelector', form);
    }

    if ($shippingAddressSelector && $shippingAddressSelector.length === 1) {
        $shippingAddressSelector.empty();
        // Add New Address option
        $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order));
        // Separator -
        $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            order.resources.shippingAddresses, false, order, { className: 'multi-shipping' }
        ));

        shippings.forEach(function (aShipping) {
            if (!aShipping.selectedShippingMethod || !aShipping.selectedShippingMethod.storePickupEnabled) {
                var isSelected = shipping.UUID === aShipping.UUID;
                hasSelectedAddress = hasSelectedAddress || isSelected;

                var addressOption = addressHelpers.methods.optionValueForAddress(
                        aShipping,
                        isSelected,
                        order,
                        { className: 'multi-shipping' }
                );
                var newAddress = addressOption.html() === order.resources.addNewAddress;
                var matchingUUID = aShipping.UUID === shipping.UUID;
                if ((newAddress && matchingUUID) || (!newAddress && matchingUUID) || (!newAddress && !matchingUUID)) {
                    $shippingAddressSelector.append(addressOption);
                }
                if (newAddress && !matchingUUID) {
                    $(addressOption[0]).remove();
                }
            }
        });
        if (customer.addresses && customer.addresses.length > 0) {
            $shippingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = shipping.matchingAddressId === address.ID;
                $shippingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress({
                        UUID: 'ab_' + address.ID,
                        shippingAddress: address
                    }, isSelected, order)
                );
            });
        }
    }

    if (!hasSelectedAddress) {
        // show
        $(form).addClass('hide-details');
    } else {
        $(form).removeClass('hide-details');
    }
}

/**
 * Update the shipping UI for a single shipping info (shipment model)
 * @param {Object} shipping - the shipping (shipment model) model
 * @param {Object} order - the order/basket model
 * @param {Object} customer - the customer model
 * @param {Object} [options] - options for updating PLI summary info
 * @param {Object} [options.keepOpen] - if true, prevent changing PLI view mode to 'view'
 */
bopisShipping.methods.updateShippingInformation = function(shipping, order, customer, options) {
    // First copy over shipmentUUIDs from response, to each PLI form
    order.shipping.forEach(function (aShipping) {
        aShipping.productLineItems.items.forEach(function (productLineItem) {
            bopisShipping.methods.updateProductLineItemShipmentUUIDs(productLineItem, aShipping);
        });
    });

    // Now update shipping information, based on those associations
    bopisShipping.methods.updateShippingMethods(shipping);
    bopisShipping.methods.updateShippingAddressFormValues(shipping);
    bopisShipping.methods.updateShippingSummaryInformation(shipping, order);

    // And update the PLI-based summary information as well
    shipping.productLineItems.items.forEach(function (productLineItem) {
        bopisShipping.methods.updateShippingAddressSelector(productLineItem, shipping, order, customer);
        bopisShipping.methods.updatePLIShippingSummaryInformation(productLineItem, shipping, order, options);
    });
}

/**
 * updates the shipping method radio buttons within shipping forms
 * @param {Object} shipping - the shipping (shipment model) model
 */
bopisShipping.methods.updateShippingMethods = function(shipping) {
    var uuidEl = $('input[value=' + shipping.UUID + ']');
    if (uuidEl && uuidEl.length > 0) {
        $.each(uuidEl, function (shipmentIndex, el) {
            var form = el.form;
            if (!form) return;

            var $shippingMethodList = $('.shipping-method-list', form);

            if ($shippingMethodList && $shippingMethodList.length > 0) {
                $shippingMethodList.empty();
                var shippingMethods = shipping.applicableShippingMethods;
                var selected = shipping.selectedShippingMethod || {};
                var shippingMethodFormID = form.name + '_shippingAddress_shippingMethodID';
                var storePickupIsSelected = selected.storePickupEnabled;

                // Create the new rows for each shipping method
                $.each(shippingMethods, function (methodIndex, shippingMethod) {
                    var isStorePickupOptionAndSelected = storePickupIsSelected && shippingMethod.storePickupEnabled;
                    var isNotStorePickupOptionAndStorePickupNotSelected = !storePickupIsSelected && !shippingMethod.storePickupEnabled;
                    var showShippingOption = isStorePickupOptionAndSelected || isNotStorePickupOptionAndStorePickupNotSelected;

                    // only show pickup option for pickup line items and only show other options for non-pickup items
                    if (showShippingOption) {
                        var tmpl = $('#shipping-method-template').clone();
                        // set input
                        $('input', tmpl)
                            .prop('id', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID)
                            .prop('name', shippingMethodFormID)
                            .prop('value', shippingMethod.ID)
                            .attr('checked', shippingMethod.ID === selected.ID)
                            .attr('data-pickup', shippingMethod.storePickupEnabled);

                        $('label', tmpl)
                            .prop('for', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID);
                        // set shipping method name
                        $('.display-name', tmpl).text(shippingMethod.displayName);
                        // set or hide arrival time
                        if (shippingMethod.estimatedArrivalTime) {
                            $('.arrival-time', tmpl)
                                .text('(' + shippingMethod.estimatedArrivalTime + ')')
                                .show();
                        }
                        if ('description' in shippingMethod && shippingMethod.description) {
                            $('.tooltip-icon', tmpl).attr('title', shippingMethod.description)
                            .show();
                        }
                        // set shipping cost
                        $('.shipping-cost', tmpl).text(shippingMethod.shippingCost);
                        $shippingMethodList.append(tmpl.html());
                    }
                });
            }
        });
    }
    $('body').trigger('tooltip:init');
    $('body').trigger('shipping:updateShippingMethods', { shipping: shipping });
}

module.exports = bopisShipping;
