'use strict';

var siteIntegrations = require('integrations/integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var integrationsMembers = require('integrations/checkout/plugin/members');
var integrationsMembersHandleShippingStage = integrationsMembers.handleShippingStage;
var integrationsMembersInitialize = integrationsMembers.initialize;
var integrationsMembersUpdateStage = integrationsMembers.updateStage;
var integrationsMembersGotoStage = integrationsMembers.gotoStage;
var membersExtensions = [];
var googleAddressValidation = require('core/checkout/googleAddressValidation');

/**
 * Review Order (.submit-payment) must always run payment SubmitPayment.
 * After Edit Payment, accordion UX can leave members.currentStage on placeOrder while
 * the payment UI is visible — first click then hits CheckoutServices-PlaceOrder.
 * @param {Event} e click event from next-step button
 * @returns {void}
 */
function syncStageToClickedCheckoutButton(e) {
    if (!e) {
        return;
    }

    var clicked = e.currentTarget || e.target;
    var button = clicked && clicked.closest ? clicked.closest('button') : null;

    if (!button || !this.checkoutStages) {
        return;
    }

    var isSubmitPayment = button.classList.contains('submit-payment')
        || button.getAttribute('value') === 'submit-payment';
    var isPlaceOrderOnly = (button.classList.contains('place-order')
            || button.getAttribute('value') === 'place-order'
            || button.id === 'submit-order')
        && !isSubmitPayment;

    if (isSubmitPayment) {
        var paymentIdx = this.checkoutStages.indexOf('payment');
        if (paymentIdx > -1 && this.currentStage !== paymentIdx) {
            this.currentStage = paymentIdx;
            if (this.context) {
                $(this.context).attr('data-checkout-stage', 'payment');
            }
        }
        return;
    }

    if (isPlaceOrderOnly) {
        var placeOrderIdx = this.checkoutStages.indexOf('placeOrder');
        if (placeOrderIdx > -1 && this.currentStage !== placeOrderIdx) {
            this.currentStage = placeOrderIdx;
            if (this.context) {
                $(this.context).attr('data-checkout-stage', 'placeOrder');
            }
        }
    }
}

membersExtensions.push({
    updateStage: function updateStage(e, defer, parent) {
        syncStageToClickedCheckoutButton.call(this, e);
        return integrationsMembersUpdateStage.apply(this, arguments);
    },

    gotoStage: function gotoStage(stageName) {
        var result = integrationsMembersGotoStage.apply(this, arguments);

        // Keep accordion/CSS aligned when returning from Review to Payment.
        if (stageName === 'payment') {
            $('.accordion').removeClass('active').find('.panel').slideUp();
            $('#payment').addClass('active').find('.panel').slideDown();
            $('#customer .panel, #shipping .panel').slideUp();
        }

        return result;
    }
});
if (toggleObject.AffirmOnline) {
    var integrationsUpdateUrl = integrationsMembers.updateUrl;
    var integrationsHandlePlaceOrderStage = integrationsMembers.handlePlaceOrderStage;

    /**
     * Updates the URL to determine stage
     * @param {number} currentStage - The current stage the user is currently on in the checkout
     */
    membersExtensions.push({
        updateUrl: function (currentStage) {
            integrationsUpdateUrl.apply(this, arguments);

            if (this.checkoutStages[currentStage] == 'payment') {
                // if ($('#affirm-config').data('affirmenabled')) {
                //     $('.affirm-payment-tab').trigger('click');
                // }
            } else if (this.checkoutStages[currentStage] == 'placeOrder') {
                if ($('.payment-information').data('payment-method-id') == 'Affirm') {
                    var url = $('#affirm-config').data('affirupdateurl');
                    $.spinner().start();
                    $.ajax({
                        url: url,
                        method: 'GET',
                        success: function (data) {
                            $('#vcn-data').data('vcndata', JSON.parse(data.vcndata));
                            $.spinner().stop();
                        }
                    });
                }
            }
        },
        handlePlaceOrderStage: function (e, defer) {
            if (($('.payment-summary .js-affirm-payment-description').length <= 0) // when affirm is not used
                || ($('#affirm-config').data('vcnenabled') && $('#vcn-data').data('vcncomplete'))) { // or vcn is enabled but complete

                return integrationsHandlePlaceOrderStage.apply(this, arguments);
            }

            return defer;
        },
        handleNextStage: function (bPushState) {
                var parent = this;
                if (parent.currentStage < parent.checkoutStages.length - 1) {
                    // move stage forward
                    parent.currentStage++;
        
                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        parent.updateUrl(parent.currentStage);
                    }
                }
        
                // Set the next stage on the DOM
                $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);
        
                // Set accordion active for next stage
                let checkoutStage = parent.checkoutStages[parent.currentStage];

                
                if(checkoutStage) {
                    $(".panel").slideUp();
                    $(".accordion").removeClass("active");

                    if(checkoutStage == "placeOrder"){
                        $('#payment').addClass("active");
                        $('#payment').find(".panel").slideDown();
                        $('#customer .panel').slideUp();
                        $('#shipping .panel').slideUp();
                        return;
                    }

                    $(`#${checkoutStage}`).addClass("active");
                    $(`#${checkoutStage}`).find(".panel").slideDown();

                    if(checkoutStage == "payment"){
                        $('#customer .panel').slideUp();
                        $('#shipping .panel').slideUp();
                    }

                } else {
                    $(".accordion").first().addClass("active");
                    $(".accordion").first().find(".panel").slideDown();
                }
        
                // addressHelpers.initAutocomplete();
            }
    });
}

membersExtensions.push({
    handleNextStage: function (bPushState) {
        $('#place-order-terms-condition').prop('checked', false);
                var parent = this;
                if (parent.currentStage < parent.checkoutStages.length - 1) {
                    // move stage forward
                    parent.currentStage++;
        
                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        parent.updateUrl(parent.currentStage);
                    }
                }
        
                // Set the next stage on the DOM
                $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);
        
                // Set accordion active for next stage
                let checkoutStage = parent.checkoutStages[parent.currentStage];
                
                if(checkoutStage) {
                    $(".panel").slideUp();
                    $(".accordion").removeClass("active");

                    if(checkoutStage == "placeOrder"){
                        $('#payment').addClass("active");
                        $('#payment').find(".panel").slideDown();
                        $('#customer .panel').slideUp();
                        $('#shipping .panel').slideUp();
                        return;
                    }

                    $(`#${checkoutStage}`).addClass("active");
                    $(`#${checkoutStage}`).find(".panel").slideDown();

                    if(checkoutStage == "payment"){
                        $('#customer .panel').slideUp();
                        $('#shipping .panel').slideUp();
                    }

                } else {
                    $(".accordion").first().addClass("active");
                    $(".accordion").first().find(".panel").slideDown();
                }
        
                // addressHelpers.initAutocomplete();
            }
});


if (toggleObject.smartyEnabled && toggleObject.smartyAddressURL && toggleObject.smartyAPIKey) {

    /**
     * Updates the shipping stage to validate addresses
     */
    membersExtensions.push({
        verifysmartyAddress: function (data) {
            var url = toggleObject.smartyAddressURL+'?auth-id='+toggleObject.smartyAPIKey+'&street='+data.address1+'&street2='+data.address2+'&city='+data.city+'&state='+data.state+'&zipcode='+data.zipcode+'&match=enhanced&candidates=5&geocode=true';
            $.ajax({
                url: url,
                method: 'GET',
                success: function (response) {
                    var userData = data;
                    var suggestionsData = {};

                    if(response.length > 0){
                        suggestionsData = Object.assign({}, data);
                        suggestionsData.matchcode = (response[0].analysis.dpv_match_code ? response[0].analysis.dpv_match_code : 'No');
                        suggestionsData.address1 = response[0].delivery_line_1;
                        suggestionsData.address2 = (response[0].delivery_line_2 ? response[0].delivery_line_2 : '');
                        suggestionsData.city = response[0].components.city_name;
                        suggestionsData.state = response[0].components.state_abbreviation
                        suggestionsData.zipcode = response[0].components.zipcode;
                        suggestionsData.enhanced_match = response[0].analysis.enhanced_match;
                        suggestionsData.analysis = response[0].analysis;
                    }

                    if (response[0] != 'undefined' && response[0].metadata.zip_type == 'POBox') {
                        $('#smartyPOVerificationModal').modal('show');
                        return;
                    }

                    var userDataStr = JSON.stringify(userData);
                    var suggestionsDataStr = JSON.stringify(suggestionsData);

                    if (suggestionsData.matchcode == 'No') {
                        $('.suggestionAddress').addClass('d-none');
                        $('.addresscontent').addClass('notfound');
                        $('.infomessage').show();
                        $('.smartyVerification-modal .subtitle').hide();
                    } else {
                        $('.infomessage').hide();
                        $('.suggestionAddress').removeClass('d-none');
                        $('.addresscontent').removeClass('notfound');
                        $('.smartyVerification-modal .subtitle').show();
                    }

                    $('.suggestionAddress').attr('data-json',suggestionsDataStr);
                    $('.userenterAddress').attr('data-json',userDataStr);
                    $('.userenterAddress .addressinfo').html(userData.firstName +' ' + userData.lastName+ '<br/>' + userData.address1 + ', '+ userData.address2+ '<br/>' + userData.city + ' '+ userData.state + ' US <br/>'+ userData.zipcode+ '<br/>'+ userData.phone );
                    $('.suggestionAddress .addressinfo').html(suggestionsData.firstName +' ' + suggestionsData.lastName+ '<br/>' + suggestionsData.address1 + ' '+ suggestionsData.address2+ '<br/>' + suggestionsData.city + ' '+ suggestionsData.state + ' US <br/>'+ suggestionsData.zipcode+ '<br/>'+ suggestionsData.phone );
                    if (userData.address1 === suggestionsData.address1 && userData.address2 === suggestionsData.address2 && userData.city === suggestionsData.city && userData.state === suggestionsData.state && userData.zipcode === suggestionsData.zipcode) {
                        $('.submit-verifyAddress').data('addressvalidated', true);
                        $('.submit-verifyAddress').click();
                    } else {
                        $('#smartyVerificationModal').modal('show');
                    }
                },
                error: function () {
                    $('.submit-verifyAddress').data('addressvalidated', true);
                    $('.submit-verifyAddress').click();
                },
            });
        },
        handleShippingStage: function(e, defer) {
            var formHelpers = require('core/checkout/formErrors');
            //
            // Submit the Shipping Address Form
            //
            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formSelector = isMultiShip ?
                '.multi-shipping .active form' : '.single-shipping .shipping-form';
            var form = $(formSelector);
            var isAddressValid = $('.submit-verifyAddress').data('addressvalidated');
            var formData = {
                firstName : form.find('.shippingFirstName').val(),
                lastName : form.find('.shippingLastName').val(),
                address1: form.find('.shippingAddressOne').val(),
                address2: form.find('.shippingAddressTwo').val(),
                city: form.find('.shippingAddressCity').val(),
                state: form.find('.shippingState').val(),
                zipcode: form.find('.shippingZipCode').val(),
                phone: form.find('.shippingPhoneNumber').val()
            }
            if (formData.firstName && formData.lastName && formData.address1 && formData.city && formData.state && formData.zipcode && isAddressValid == false) {
                //
                // Clear Previous Errors
                //
                formHelpers.clearPreviousErrors('.shipping-form');

                this.verifysmartyAddress(formData);

                return false;
            }

            return integrationsMembersHandleShippingStage.apply(this, arguments);
        },
        /**
        * Initialize the checkout stage.
        *
        * TODO: update this to allow stage to be set from server?
        */
        initialize: function (target) {
            var result = integrationsMembersInitialize.apply(this, arguments);

            $('body').on('click', '.smartyVerification-modal .confirm-address', function(e){
                e.preventDefault();
                $('.submit-verifyAddress').data('addressvalidated', true);
                $('#smartyVerificationModal').modal('hide');
                $('.submit-verifyAddress').click();
            });

            $('body').on('click', '.smartyVerification-modal .update-address', function(e){
                e.preventDefault();
                var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                var formSelector = isMultiShip ?
                '.multi-shipping .active form' : '.single-shipping .shipping-form';
                var form = $(formSelector);
                var suggestionData = $('.update-address').parents('.suggestionAddress').data('json');
                form.find('.shippingAddressOne').val(suggestionData.address1);
                form.find('.shippingAddressTwo').val(suggestionData.address2);
                form.find('.shippingAddressCity').val(suggestionData.city);
                form.find('.shippingState').val(suggestionData.state);
                form.find('.shippingZipCode').val(suggestionData.zipcode);
                $('.submit-verifyAddress').data('addressvalidated', true);
                $('#smartyVerificationModal').modal('hide');
                $('.submit-verifyAddress').click();
            });

            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formSelector = isMultiShip ?
                '.multi-shipping .active form' : '.single-shipping .shipping-form';
            var form = $(formSelector);
            $('body').on('change', form, function(e){
                e.preventDefault();
                $('.submit-verifyAddress').data('addressvalidated', false);
            });

            return result;
        }
    });
}

function getShippingForm() {
    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
    var formSelector = isMultiShip ?
        '.multi-shipping .active form' : '.single-shipping .shipping-form';

    return $(formSelector);
}

if (toggleObject.googlePlacesEnabled || !toggleObject.smartyEnabled) {
    membersExtensions.push({
        handleShippingStage: function(e, defer) {
            var form = getShippingForm();
            var submitButton = $('.submit-verifyAddress');

            if (submitButton.data('googlezipvalidated')) {
                submitButton.data('googlezipvalidated', false);
                return integrationsMembersHandleShippingStage.apply(this, arguments);
            }

            if (googleAddressValidation.shouldValidateUSZipState(form)) {
                var formHelpers = require('core/checkout/formErrors');

                formHelpers.clearPreviousErrors('.shipping-form');

                googleAddressValidation.validateUSZipState(form, function (isValid) {
                    if (isValid) {
                        googleAddressValidation.clearZipError(form);
                        submitButton.data('googlezipvalidated', true);
                        submitButton.click();
                    } else {
                        googleAddressValidation.showZipError(form);
                        googleAddressValidation.scrollToZipError(form);
                    }
                });

                return false;
            }

            return integrationsMembersHandleShippingStage.apply(this, arguments);
        }
    });
}

membersExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            integrationsMembers[item] = $.extend({}, integrationsMembers[item], library[item]);
        } else {
            integrationsMembers[item] = library[item];
        }
    });
});

module.exports = integrationsMembers;
