'use strict';

/**
 * Handles the initial state of single shipping on page load
 */
function handleInitialSingleship() {
    var pickupSelected = $(':checked', '.shipping-method-list').data('pickup');
    var storeSelected = $('.store-details').length > 0;
    var $shippingForm = $('.single-shipping .shipping-form');
    var storeID = storeSelected ? $('.store-details').data('store-id') : null;

    if (pickupSelected && storeSelected) {
        $shippingForm
            .find('.pickup-in-store')
            .removeClass('d-none')
            .append('<input type="hidden" name="storeId" value="' + storeID + '" />');
        $shippingForm.find('.shipment-selector-block').addClass('d-none');
        $shippingForm.addClass('in-store-pickup');
    }
}

/**
 * Handles the initial state of multi-shipping on page load
 */
function handleInitialMultiship() {
    var multishipReady = $(':checked', '.multi-shipping .shipping-method-list').length > 0;

    $(':checked', '.multi-shipping .shipping-method-list').each(function () {
        var pickupSelected = $(this).data('pickup');
        var $shippingForm = $(this).closest('form');
        var $store = $shippingForm.find('.store-details');
        var storeSelected = $store.length > 0;
        var storeID = storeSelected ? $store.data('store-id') : null;

        if (pickupSelected && storeSelected) {
            $shippingForm
                .find('.pickup-in-store')
                .removeClass('d-none')
                .append('<input type="hidden" name="storeId" value="' + storeID + '" />');
            $('#multiShipCheck').attr('disabled', true);
        } else {
            $shippingForm.find('.pickup-in-store').addClass('d-none');
            $shippingForm.find('.shipping-address-block').removeClass('d-none');
        }

        if ($shippingForm.find('[data-action="edit"]').hasClass('d-none')) {
            multishipReady = false;
        }
    });

    // Make sure continue button is enabled if all addresses are populated
    if (multishipReady) {
        $('.next-step-button .submit-shipping').attr('disabled', null);
    }
}

module.exports = {
    initialStoreMethodSelected: function () {
        $(document).ready(function () {
            var isMultiship = $('#checkout-main').hasClass('multi-ship');
            if (isMultiship) {
                handleInitialMultiship();
            } else {
                handleInitialSingleship();
            }
        });
    },
    updateAddressLabelText: function () {
        $('body').on('shipping:updateAddressLabelText', function (e, data) {
            var addressLabelText = data.selectedShippingMethod.storePickupEnabled ? data.resources.storeAddress : data.resources.shippingAddress;
            data.shippingAddressLabel.text(addressLabelText);
        });
    },
    updateAddressButtonClick: function () {
        $('body').on('click', '.btn-show-details', (function () {
            $(this).closest('.shipment-selector-block').siblings('.shipping-address-block').removeClass('d-none');
        }));
    }
};
