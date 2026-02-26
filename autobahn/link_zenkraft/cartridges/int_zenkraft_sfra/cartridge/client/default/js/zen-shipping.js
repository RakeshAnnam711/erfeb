/* global $, google */
'use strict';

var shipping = require('app_storefront_base/checkout/shipping');
var addressHelpers = require('app_storefront_base/checkout/address');
var dropOffModal = require('./dropOffModal');

var baseObj = shipping;

$('body').on('shipping:updateShippingMethods', function (e, shippingdata) {
    var shipping = shippingdata.shipping;
    var checkedInput = $("input[name='dwfrm_shipping_shippingAddress_shippingMethodID']:checked");
    $('label.hip-method-row').removeClass('border-primary selected');
    $('label[for="'+ checkedInput.attr('id') +'"]').addClass('border-primary selected');
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
                // Create the new rows for each shipping method
                $.each(shippingMethods, function (index, shippingMethod) {
                    // if there is no drop off location for that address do not show the drop off shipping method
                    if (shippingMethod.dropOffMethod && shippingMethod.dropOffLocations && shippingMethod.dropOffLocations.length === 0) {
                        return;
                    }
                    var tmpl = $('#shipping-method-template').clone();
                    var thisLabel = $('label', tmpl);
                    var thisInput = $('input', tmpl)
                    var labelLeft = thisLabel.find('.col-10');
                    var labelRight = thisLabel.find('.col-2');
                    // set input
                    thisInput.prop('id', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID);
                    thisInput.prop('name', shippingMethodFormID);
                    thisInput.prop('value', shippingMethod.ID);
                    thisInput.attr('checked', shippingMethod.ID === selected.ID);
                    // set label
                    thisLabel.prop('for', 'shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID);
                    thisLabel.attr('data-methodid', shippingMethod.ID);
                    // update preselected shipping method class list
                    if (shippingMethod.ID === selected.ID) {
                        thisLabel.addClass('border-primary selected');
                        if (shippingMethod.dropOffMethod) {
                            $('form').attr('data-address-mode', 'new');
                            $('.btn-show-details').parents('.form-group').addClass('d-none');
                        }
                    }
                    if (!shippingMethod.dropOffMethod && (!shippingMethod.futureDeliveryDates || shippingMethod.futureDeliveryDates.length === 0)) {
                        if (shippingMethod.estimatedArrivalTime && !shippingMethod.futureDeliveryDates && !shippingMethod.dropOffMethod) {
                            // WGACA Customization - Disable EDD @see https://wgacany.atlassian.net/browse/SALESFORCE-90
                            // labelLeft.append('<div class="arrival-time col-12"> ' + shippingMethod.estimatedArrivalTime.toUpperCase() + '</div>');
                        }
                        labelLeft.append('<div class="col-1 d-flex m-auto"><i class="fa fa-truck" aria-hidden="true"></i></div><div class="shipping-method-name col-11">' + shippingMethod.displayName + '</div>');
                    } else if (shippingMethod.dropOffMethod) {
                        labelLeft.append('<div class="shipping-method-name col-12 font-weight-bold">' + shippingMethod.displayName + '</div>');
                    } else {
                        labelLeft.append('<div class="shipping-method-name col-12">' + shippingMethod.displayName + '</div>');
                        if (shippingMethod.estimatedArrivalTime && !shippingMethod.futureDeliveryDates && !shippingMethod.dropOffMethod) {
                            // WGACA Customization - Disable EDD @see https://wgacany.atlassian.net/browse/SALESFORCE-90
                            // labelLeft.append('<div class="col-1 d-flex m-auto"><i class="fa fa-truck" aria-hidden="true"></i></div><div class="arrival-time col-11"> ' + shippingMethod.estimatedArrivalTime.toUpperCase() + '</div>');
                        }
                    }

                    // display possible future delivery dates
                    if (shippingMethod.futureDeliveryDates && shippingMethod.futureDeliveryDates.length > 0) {
                        labelLeft.append('<div class="col-1 d-flex m-auto"><i class="fa fa-calendar" aria-hidden="true"></i></div> <div class="col-11"><select class="custom-select"></select></div>');
                        shippingMethod.futureDeliveryDates.forEach(function (dateObject) {
                            labelLeft.find('select').append(
                                '<option value="'+ dateObject.date +'">' + dateObject.formatedDate.toUpperCase() + '</option>'
                            );
                        });
                        thisLabel.addClass('future-delivery-method');
                    }
                    // format the drop off method
                    if (shippingMethod.dropOffMethod) {
                        sessionStorage['shippingMethod-' + shippingMethod.ID + '-' + shipping.UUID] = JSON.stringify(shippingMethod.dropOffLocations);
                        var firstDopuLocation = shippingMethod.dropOffLocations[0];
                        labelLeft.append('<div class="col-1 d-flex m-auto"><i class="fa fa-building-o" aria-hidden="true"></i></div>' +
                        '<div class="col-11"><div>' + shippingMethod.estimatedArrivalTime.toUpperCase() +
                        '</div><div class="drop-off-method-name">' + dropOffModal.getDropOffLocationDisplayName(firstDopuLocation).toUpperCase() +
                        '</div><div><span class="drop-off-method-distance">' +
                        firstDopuLocation.distance + ' ' + dropOffModal.getDistanceUnitDisplayValue(firstDopuLocation.distance_units) +
                        ' away</span><span class="change-dopu-link" data-sessionid="shippingMethod-'+ shippingMethod.ID + '-' + shipping.UUID +
                        '" data-activelocation="'+ dropOffModal.getDropOffLocationId(firstDopuLocation) +'"> Other locations</span></div></div>');
                        var methodNameContainer = labelLeft.find('.shipping-method-name');
                        /* thisLabel.attr('data-toggle','modal').attr('data-target', '#drop-off-modal'); */
                        methodNameContainer.html(methodNameContainer.html() + ' PICK-UP LOCATION');
                        thisLabel.addClass('drop-off-method');
                    }
                    // display the method shipping cost
                    labelRight.append('<div class="shipping-cost text-center">' + shippingMethod.shippingCost + '</div>')
                    $shippingMethodList.append(tmpl.html());
                });
            }
        });
    }

    // overwrite existing event handler
    $('.shipping-method-list').off('change');
    $('.shipping-method-list').on('change', function (e) {
        if (e.target.type === 'select-one') {
            return;
        }
        var $shippingForm = $(this).parents('form');
        var input =  $('input[type=radio]:checked', this);
        if (input.parents('label').is(":visible")) {
            var methodID = input.val();
            var shipmentUUID = $shippingForm.find('[name=shipmentUUID]').val();
            var urlParams = addressHelpers.methods.getAddressFieldsFromUI($shippingForm);
            urlParams.shipmentUUID = shipmentUUID;
            urlParams.methodID = methodID;
            urlParams.isGift = $shippingForm.find('.gift').prop('checked');
            urlParams.giftMessage = $shippingForm.find('textarea[name$=_giftMessage]').val();
            var url = $(this).data('select-shipping-method-url');
            if (baseObj.methods && baseObj.methods.selectShippingMethodAjax) {
                baseObj.methods.selectShippingMethodAjax(url, urlParams, $(this));
            } else {
                selectShippingMethodAjax(url, urlParams, $(this));
            }
        }
    });
});

$(document).ready(function () {
    var _postal = $('input[name$="shippingAddress_addressFields_postalCode"]');
    var updated = false;
    _postal.each(function(index, postal) {
        if ($(postal).val().length > 0 && $(postal).is(":visible")) {
            if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                baseObj.methods.updateShippingMethodList($(postal).parents('form'));
                updated = true;
            } else {
                updateShippingMethodList($(postal).parents('form'));
                updated = true;
            }
        }
        if (!updated && $(_postal[0]).val().length > 0) {
            if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
                baseObj.methods.updateShippingMethodList($(_postal[0]).parents('form'));
                updated = true;
            } else {
                updateShippingMethodList($(_postal[0]).parents('form'));
                updated = true;
            }
        }
    });
    $('select[name$="shippingAddress_addressFields_states_stateCode"]').off('change');
    $(document).off('change', 'select[name$="shippingAddress_addressFields_states_stateCode"]');
});

$(document).on('change', 'input[name$="dwfrm_shipping_shippingAddress_addressFields_postalCode"]', function (e) {
    if (baseObj.methods && baseObj.methods.updateShippingMethodList) {
        baseObj.methods.updateShippingMethodList($(e.currentTarget.form));
    } else {
        updateShippingMethodList($(e.currentTarget.form));
    }
});

$(document).on('change', '.future-delivery-method select.custom-select', function (e) {
    if($('#requested-delivery-date').length === 0) {
        $('#dwfrm_shipping').append('<input type="hidden" id="requested-delivery-date" name="requested_delivery_date" class="drop-off-location-data"/>');
    }
    var data = {
        methodID: $(this).parents('label').data('methodid'),
        date: $(e.target).val()
    }
     $('#requested-delivery-date').val(JSON.stringify(data));
});

$(document).on('click','button.choose-location', function (e) {
    e.preventDefault();
    var shipForm = $(this).parents('form')
    var collectionPointData = JSON.parse(sessionStorage['collection-point-' + $(this).parents('.collection-point').attr('id')]);
    $('input[name$=_address1]', shipForm).val(collectionPointData.street1);
    $('input[name$=_city]', shipForm).val(collectionPointData.city);
    $('input[name$=_postalCode]', shipForm).val(collectionPointData.postal_code);
    if ($('.drop-off-location-data').length === 0) {
        shipForm.append('<input type="hidden" name="drop_off_location_data" class="drop-off-location-data"/>');
    }
    $('.drop-off-location-data').val(JSON.stringify({
        location_code: dropOffModal.getDropOffLocationId(collectionPointData),
        location_name: dropOffModal.getDropOffLocationDisplayName(collectionPointData)
    }));
    shipForm.find('.change-dopu-link').attr('data-activelocation', dropOffModal.getDropOffLocationId(collectionPointData));
    shipForm.attr('data-address-mode', 'new');
    $('.btn-show-details').parents('.form-group').addClass('d-none');
    $('.drop-off-method-name').html(dropOffModal.getDropOffLocationDisplayName(collectionPointData));
    $('.drop-off-method-distance').html(collectionPointData.distance + ' ' +
    dropOffModal.getDistanceUnitDisplayValue(collectionPointData.distance_units) + 'away');
});
