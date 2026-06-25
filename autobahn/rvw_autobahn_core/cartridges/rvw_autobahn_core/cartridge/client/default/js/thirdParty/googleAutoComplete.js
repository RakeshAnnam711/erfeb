'use strict';

// WGACA IMPLEMENTATION - modify
var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();
var clientSideValidation = require('core/components/clientSideValidation');

// IE12-15 Polyfill for forEach
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}
if (window.HTMLCollection && !HTMLCollection.prototype.forEach) {
    HTMLCollection.prototype.forEach = Array.prototype.forEach;
}

function GoogleAutoComplete(autocomplete, element) {
    var autocomplete = autocomplete;
    var googleAutocompleteListener = null; // needed to remove listener from failed load
    var productLineItemUUID;
    var productLineItemElement = element.form.querySelector('[name="productLineItemUUID"]');
    if (!productLineItemElement) {
        productLineItemUUID = "default";
    } else {
        productLineItemUUID = productLineItemElement.value;
    }

    //Maps out formField ID (the name of each object, with the google Type element ID that cooresponds to each form field, and the value type to use (long or short)
    var componentForm = {};
    componentForm["shippingAddressOne" + productLineItemUUID] = {
        "googleType": ["street_number", "route"],
        "valueType": "long_name"
    };
    componentForm["shippingAddressCity" + productLineItemUUID] = {
        "googleType": ["locality"],
        "valueType": "long_name"
    };
    componentForm["shippingState" + productLineItemUUID] = {
        "googleType": ["administrative_area_level_1"],
        "valueType": "short_name"
    };
    componentForm["shippingZipCode" + productLineItemUUID] = {
        "googleType": ["postal_code"],
        "valueType": "long_name"
    };
    componentForm["shippingCountry" + productLineItemUUID] = {
        "googleType": ["country"],
        "valueType": "short_name"
    };
    // My Account-Add Address
    var componentForm2 = {
        "address1": {
            "googleType": ["street_number", "route"],
            "valueType": "long_name"
        },
        "city": {
            "googleType": ["locality"],
            "valueType": "long_name"
        },
        "state": {
            "googleType": ["administrative_area_level_1"],
            "valueType": "short_name"
        },
        "zipCode": {
            "googleType": ["postal_code"],
            "valueType": "long_name"
        },
        "country": {
            "googleType": ["country"],
            "valueType": "short_name"
        }
    };
    // Billing Add New Address
    var componentForm3 = {
        "billingAddressOne": {
            "googleType": ["street_number", "route"],
            "valueType": "long_name"
        },
        "billingAddressCity": {
            "googleType": ["locality"],
            "valueType": "long_name"
        },
        "billingState": {
            "googleType": ["administrative_area_level_1"],
            "valueType": "short_name"
        },
        "billingZipCode": {
            "googleType": ["postal_code"],
            "valueType": "long_name"
        },
        "billingCountry": {
            "googleType": ["country"],
            "valueType": "short_name"
        }
    };

    function getPlaceComponent(place, type, valueType) {
        var components = place && place.address_components ? place.address_components : [];

        for (var i = 0; i < components.length; i++) {
            if (components[i].types.indexOf(type) !== -1) {
                return components[i][valueType] || '';
            }
        }

        return '';
    }

    function storeGoogleSelectedShippingAddress(place) {
        if (!element.form) {
            return;
        }

        element.form.setAttribute('data-google-selected-state', getPlaceComponent(place, 'administrative_area_level_1', 'short_name'));
        element.form.setAttribute('data-google-selected-zip', getPlaceComponent(place, 'postal_code', 'long_name'));
        element.form.setAttribute('data-google-selected-country', getPlaceComponent(place, 'country', 'short_name'));
    }

    var fillInCheckoutAddress = function fillInCheckoutAddress() {
        var checkout = document.getElementById('checkout-main');
        if (checkout) {
            var stage = checkout.dataset.checkoutStage;
            if (stage === 'customer' || stage === 'shipping') {
                fillInAddress();
            } else if (stage === 'payment') {
                fillInAddress3();
            }
        }
    }

    var fillInAddress = function fillInAddress() {
        // Get the place details from the autocomplete object.
        var place = autocomplete.getPlace();

        //clear all form fields we're populating
        for (var component in componentForm) {
            var data = document.getElementById(component);
            if (data) {
                data.value = '';
            }
        }

        // Get each component of the address from the place details,
        // and then fill-in the corresponding field on the form.
        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];

            for (var componentID in componentForm) {
                var componentValues = null;
                if (componentForm.hasOwnProperty(componentID)) {
                    componentValues = componentForm[componentID];
                }
                var type = '';
                for (type of componentValues.googleType) {
                    var val = '';
                    if (type == addressType) {
                        var element = document.getElementById(componentID);
                        if (element) {
                            //if form field needs multiple entries, seperate with a space (like address number and address street)
                            if (element.value !== '') {
                                val = element.value + ' ' + place.address_components[i][componentValues.valueType];
                            } else {
                                val = place.address_components[i][componentValues.valueType];
                            }
                            //set form field value with new value
                            element.value = val;

                            if (componentID === 'shippingStatedefault') {
                                $(element).change();
                            }
                        }
                    }
                }
            }
        }

        storeGoogleSelectedShippingAddress(place);
    }
    var fillInAddress2 = function fillInAddress2() {
        var place = autocomplete.getPlace();
        var srcEl;

        for (var component in componentForm2) {
            srcEl = document.getElementById(component);
            srcEl.value = '';
        }

        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];

            for (var componentID in componentForm2) {
                var componentValues = null;
                if (componentForm2.hasOwnProperty(componentID)) {
                    componentValues = componentForm2[componentID];
                }
                var type = '';
                for (type of componentValues.googleType) {
                    var val = '';
                    if (type == addressType) {
                        var element = document.getElementById(componentID);
                        if (element.value !== '') {
                            val = element.value + ' ' + place.address_components[i][componentValues.valueType];
                        } else {
                            val = place.address_components[i][componentValues.valueType];
                        }
                        element.value = val;

                        if (componentID === 'state') {
                            $(element).change();
                        }
                    }
                }
            }
        }

        clientSideValidation.functions.clearForm($(srcEl).closest('form'));
    }
    var fillInAddress3 = function fillInAddress3() {
        var place = autocomplete.getPlace();

        for (var component in componentForm3) {
            document.getElementById(component).value = '';
        }

        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];

            for (var componentID in componentForm3) {
                var componentValues = null;
                if (componentForm3.hasOwnProperty(componentID)) {
                    componentValues = componentForm3[componentID];
                }
                var type = '';
                for (type of componentValues.googleType) {
                    var val = '';
                    if (type == addressType) {
                        var element = document.getElementById(componentID);
                        if (element.value !== '') {
                            val = element.value + ' ' + place.address_components[i][componentValues.valueType];
                        } else {
                            val = place.address_components[i][componentValues.valueType];
                        }
                        element.value = val;

                        if (componentID === 'state') {
                            $(element).change();
                        }
                    }
                }
            }
        }
    }

    // Bias the autocomplete object to the user's geographical location,
    // as supplied by the browser's 'navigator.geolocation' object.
    var geolocate = function geolocate() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var geolocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                var circle = new google.maps.Circle({
                    center: geolocation,
                    radius: position.coords.accuracy
                });
                autocomplete.setBounds(circle.getBounds());
            });
        }
    }

    this.init = function init() {
        // Avoid paying for data that you don't need by restricting the set of
        // place fields that are returned to just the address components.
        autocomplete.setFields(['address_component']);

        // When the user selects an address from the drop-down, populate the
        // address fields in the form.
        var checkout = document.getElementById('checkout-main');
        if (checkout) {
            googleAutocompleteListener = autocomplete.addListener('place_changed', fillInCheckoutAddress);
        } else {
            googleAutocompleteListener = autocomplete.addListener('place_changed', fillInAddress2);
        }
    };

    this.destroy = function destroy() {
        // used if gm_authFailure is called.
        element.removeAttribute('disabled');
        element.disabled = false;
        element.setAttribute('placeholder', ' ');
        google.maps.event.clearInstanceListeners(element);
        if (googleAutocompleteListener !== null) {
            googleAutocompleteListener.remove();
        }
        if (autocomplete) {
            google.maps.event.clearInstanceListeners(autocomplete);
        }
    }
}

function initAutocomplete() {
    var checkout = document.getElementById('checkout-main');
    // WGACA MODIFICATION - Smarty Address Workaround
    // if (checkout) {
    //     var formFieldToAutoComplete = document.querySelectorAll('[id^="shippingAddressOne"],[id="billingAddressOne"]'); // checkout
    // } else {
    //     var formFieldToAutoComplete = document.querySelectorAll('[id="address1"]'); // my account
    // }
    if (toggleObject.googlePlacesEnabled || !(toggleObject.smartyEnabled)) {
        if (checkout) {
            if (checkout.dataset.checkoutStage === 'shipping' || checkout.dataset.checkoutStage === 'customer') {
                var formFieldToAutoComplete = document.querySelectorAll('[id^="shippingAddressOne"]'); // checkout
            } else {
                var formFieldToAutoComplete = document.querySelectorAll('[id="billingAddressOne"]'); // checkout
            }
        } else {
            var formFieldToAutoComplete = document.querySelectorAll('[id="address1"]'); // my account
        }
    }
    // END MODIFICATION

    if (formFieldToAutoComplete && formFieldToAutoComplete.length) {
        formFieldToAutoComplete.forEach(function (element) {
            element.setAttribute('placeholder', ' ');
        });
    }

    // Create the autocomplete object, restricting the search predictions to
    // geographical location types.
    var googleAutoCompletes = [];
    if (typeof google !== 'undefined' && (typeof rvw_gmautocomplete_failure === 'undefined' || !rvw_gmautocomplete_failure)
        && formFieldToAutoComplete && formFieldToAutoComplete.length) {
        formFieldToAutoComplete.forEach(function (element) {
            if (!element.classList.contains('initComplete')) {
                var googleAutoComplete = new GoogleAutoComplete(new google.maps.places.Autocomplete(element, {types: ['address']}), element);
                googleAutoComplete.init();
                googleAutoCompletes.push(googleAutoComplete);
                element.classList.add('initComplete');
            }
        });
    }

    window.gm_authFailure = function() {
        window.rvw_gmautocomplete_failure = true;
        googleAutoCompletes.forEach(function (googleAutoComplete) {
            googleAutoComplete.destroy();
        });
        console.error('General Error with Google Api');
        return false;
    };
}

module.exports = {
    initAutocomplete: initAutocomplete
}

