'use strict';

var siteIntegrations = require('integrations/integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var integrationsMembers = require('integrations/checkout/plugin/members');
var integrationsMembersHandleShippingStage = integrationsMembers.handleShippingStage;
var integrationsMembersInitialize = integrationsMembers.initialize;
var membersExtensions = [];

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

function normalizeAddressValue(value) {
    return (value || '').toString().trim().toUpperCase();
}

function normalizeZipCode(value) {
    return normalizeAddressValue(value).split('-')[0];
}

function zipPrefixInRange(prefix, start, end) {
    return prefix >= start && prefix <= end;
}

function getStateCodeFromZip(zipCode) {
    var normalizedZip = normalizeZipCode(zipCode);
    var prefix;

    if (!/^\d{5}$/.test(normalizedZip)) {
        return null;
    }

    prefix = parseInt(normalizedZip.substring(0, 3), 10);

    if (zipPrefixInRange(prefix, 350, 369)) return 'AL';
    if (zipPrefixInRange(prefix, 995, 999)) return 'AK';
    if (zipPrefixInRange(prefix, 850, 865)) return 'AZ';
    if (zipPrefixInRange(prefix, 716, 729) || prefix === 755) return 'AR';
    if (zipPrefixInRange(prefix, 900, 961)) return 'CA';
    if (zipPrefixInRange(prefix, 800, 816)) return 'CO';
    if (zipPrefixInRange(prefix, 60, 69)) return 'CT';
    if (zipPrefixInRange(prefix, 197, 199)) return 'DE';
    if (zipPrefixInRange(prefix, 320, 349)) return 'FL';
    if (zipPrefixInRange(prefix, 300, 319) || zipPrefixInRange(prefix, 398, 399)) return 'GA';
    if (zipPrefixInRange(prefix, 967, 968)) return 'HI';
    if (zipPrefixInRange(prefix, 832, 838)) return 'ID';
    if (zipPrefixInRange(prefix, 600, 629)) return 'IL';
    if (zipPrefixInRange(prefix, 460, 479)) return 'IN';
    if (zipPrefixInRange(prefix, 500, 528)) return 'IA';
    if (zipPrefixInRange(prefix, 660, 679)) return 'KS';
    if (zipPrefixInRange(prefix, 400, 427)) return 'KY';
    if (zipPrefixInRange(prefix, 700, 715)) return 'LA';
    if (zipPrefixInRange(prefix, 39, 49)) return 'ME';
    if (zipPrefixInRange(prefix, 206, 219)) return 'MD';
    if (zipPrefixInRange(prefix, 10, 27) || zipPrefixInRange(prefix, 55, 55)) return 'MA';
    if (zipPrefixInRange(prefix, 480, 499)) return 'MI';
    if (zipPrefixInRange(prefix, 550, 567)) return 'MN';
    if (zipPrefixInRange(prefix, 386, 397)) return 'MS';
    if (zipPrefixInRange(prefix, 630, 658)) return 'MO';
    if (zipPrefixInRange(prefix, 590, 599)) return 'MT';
    if (zipPrefixInRange(prefix, 680, 693)) return 'NE';
    if (zipPrefixInRange(prefix, 889, 898)) return 'NV';
    if (zipPrefixInRange(prefix, 30, 38)) return 'NH';
    if (zipPrefixInRange(prefix, 70, 89)) return 'NJ';
    if (zipPrefixInRange(prefix, 870, 884)) return 'NM';
    if (zipPrefixInRange(prefix, 100, 149) || prefix === 5 || prefix === 63 || prefix === 90) return 'NY';
    if (zipPrefixInRange(prefix, 270, 289)) return 'NC';
    if (zipPrefixInRange(prefix, 580, 588)) return 'ND';
    if (zipPrefixInRange(prefix, 430, 459)) return 'OH';
    if (zipPrefixInRange(prefix, 730, 749)) return 'OK';
    if (zipPrefixInRange(prefix, 970, 979)) return 'OR';
    if (zipPrefixInRange(prefix, 150, 196)) return 'PA';
    if (zipPrefixInRange(prefix, 6, 9)) return 'PR';
    if (zipPrefixInRange(prefix, 28, 29)) return 'RI';
    if (zipPrefixInRange(prefix, 290, 299)) return 'SC';
    if (zipPrefixInRange(prefix, 570, 577)) return 'SD';
    if (zipPrefixInRange(prefix, 370, 385)) return 'TN';
    if (zipPrefixInRange(prefix, 750, 799) || zipPrefixInRange(prefix, 885, 885)) return 'TX';
    if (zipPrefixInRange(prefix, 840, 847)) return 'UT';
    if (zipPrefixInRange(prefix, 50, 54)) return 'VT';
    if (zipPrefixInRange(prefix, 201, 205) || zipPrefixInRange(prefix, 220, 246)) return 'VA';
    if (zipPrefixInRange(prefix, 980, 994)) return 'WA';
    if (zipPrefixInRange(prefix, 247, 268)) return 'WV';
    if (zipPrefixInRange(prefix, 530, 549)) return 'WI';
    if (zipPrefixInRange(prefix, 820, 831)) return 'WY';

    return null;
}

function showGoogleZipError(form) {
    var zipInput = form.find('.shippingZipCode');
    var message = zipInput.attr('data-zip-mismatch-message') || '';

    zipInput
        .addClass('is-invalid')
        .siblings('.invalid-feedback')
        .html(message);
}

function shouldValidateUSZipState(form) {
    var googleCountry = normalizeAddressValue(form.attr('data-google-selected-country'));
    var currentCountry = normalizeAddressValue(form.find('.shippingCountry').val());
    var currentState = normalizeAddressValue(form.find('.shippingState').val());
    var currentZip = normalizeZipCode(form.find('.shippingZipCode').val());

    return (googleCountry === 'US' || currentCountry === 'US') && !!currentState && !!currentZip;
}

function getGoogleStateFromAddressComponents(addressComponents) {
    var components = addressComponents || [];

    for (var i = 0; i < components.length; i++) {
        if (components[i].types.indexOf('administrative_area_level_1') !== -1) {
            return normalizeAddressValue(components[i].short_name);
        }
    }

    return '';
}

function getGooglePostalCodeFromAddressComponents(addressComponents) {
    var components = addressComponents || [];

    for (var i = 0; i < components.length; i++) {
        if (components[i].types.indexOf('postal_code') !== -1) {
            return normalizeZipCode(components[i].long_name);
        }
    }

    return '';
}

function googleZipResultMatchesState(results, zipCode, expectedState) {
    var normalizedZip = normalizeZipCode(zipCode);

    for (var i = 0; i < results.length; i++) {
        if (getGooglePostalCodeFromAddressComponents(results[i].address_components) === normalizedZip
            && getGoogleStateFromAddressComponents(results[i].address_components) === expectedState) {
            return true;
        }
    }

    return false;
}

function validateUSZipState(form, callback) {
    var googleState = normalizeAddressValue(form.attr('data-google-selected-state'));
    var currentState = normalizeAddressValue(form.find('.shippingState').val());
    var currentZip = normalizeZipCode(form.find('.shippingZipCode').val());
    var fallbackZipState = getStateCodeFromZip(currentZip);
    var expectedState = googleState || currentState;

    if (!/^\d{5}$/.test(currentZip) || !currentState || currentState !== expectedState) {
        callback(false);
        return;
    }

    if (!window.google || !google.maps || !google.maps.Geocoder) {
        callback(fallbackZipState === expectedState);
        return;
    }

    new google.maps.Geocoder().geocode({
        address: currentZip,
        componentRestrictions: {
            country: 'US'
        }
    }, function (results, status) {
        callback(status === 'OK'
            && googleZipResultMatchesState(results || [], currentZip, expectedState));
    });
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

            if (shouldValidateUSZipState(form)) {
                var formHelpers = require('core/checkout/formErrors');

                formHelpers.clearPreviousErrors('.shipping-form');

                validateUSZipState(form, function (isValid) {
                    if (isValid) {
                        submitButton.data('googlezipvalidated', true);
                        submitButton.click();
                    } else {
                        showGoogleZipError(form);
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
