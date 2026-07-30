'use strict';

var API = require('*/cartridge/scripts/lib/libVertexApi');
var URLUtils = require('dw/web/URLUtils');
var constants = require('*/cartridge/scripts/constants');
/**
 *
 * @param {string} transactionId  unique ID
 * @param {string} source the sorce of request
 * @returns {Object} status of transaction
 */
function deleteTransaction(transactionId, source) {
    return API.DeleteTransaction(transactionId, source);
}

/**
 * Send Tax Calculation request
 *
 * @param {Object} requestType Vertex SOAP service object
 * @param {dw.order.Basket} cart the Item can be simple object in SFRA
 * @returns {boolean} false if request falls
 */
function CalculateTax(requestType, cart) {
    var Helper = require('*/cartridge/scripts/helper/helper');
    var calculationResult;
    // GC is non-taxable, set taxes for GC for correct billing page work
    Helper.prepareCart(cart);

    if (constants.SFRA) {
        if (API.isEnabled && session.privacy.VertexAddressSuggestionsError !== 'error') {
            calculationResult = API.CalculateTax(requestType, cart);

            // Check for errors in US addresses only
            if (!API.isVATEnabled && calculationResult && !calculationResult.result && calculationResult.message === 'Invalid address') {
                session.privacy.VertexAddressSuggestionsError = 'error';
                return false;
            }
        }
    } else if ((session.forms.singleshipping.fulfilled.value || (session.forms.multishipping.addressSelection.fulfilled.value && session.forms.multishipping.shippingOptions.fulfilled.value)) && API.isEnabled && session.custom.VertexAddressSuggestionsError !== 'error') {
        calculationResult = API.CalculateTax(requestType, cart);

        // Check for errors in US addresses only
        if (!API.isVATEnabled && calculationResult && !calculationResult.result && calculationResult.message === 'Invalid address') {
            session.privacy.VertexAddressSuggestionsError = 'error';
            response.redirect(URLUtils.https('COShipping-Start'));
            return false;
        }
    }
}

/**
 * Check if address is already in Vertex suggestions response
 *
 * @param {Object} formShipAddress address
 * @returns {boolean} true if address already is in Vertex suggestions (session)
 */
function inSuggestions(formShipAddress) {
    var vertexAddressSuggestions = JSON.parse(session.privacy.VertexAddressSuggestions);
    var inSuggestion;

    var checkFields = ['address1', 'city', 'postalCode'];
    if (vertexAddressSuggestions) {
        inSuggestion = vertexAddressSuggestions.some(function (suggestedAddress) {
            return checkFields.every(function (fieldName) {
                return formShipAddress[fieldName].htmlValue === suggestedAddress[fieldName];
            });
        });
    }
    return inSuggestion;
}

/**
 *
 * @param {Object} addressForm form with fields that influe on address
 * @returns {boolean} true if form was changed
 */
function isFormChanged(addressForm) {
    var singleShipping = {};
    var form = addressForm;
    var checkFields = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'country', 'phone'];

    /* Check for non-SFRA */
    if (form.object) {
        form = form.object;
        checkFields = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postal', 'country', 'phone'];
    }
    if (!session.privacy.singleshipping) {
        singleShipping = {
            firstName : form.shippingAddress.addressFields.firstName.htmlValue,
            lastName  : form.shippingAddress.addressFields.lastName.htmlValue,
            address1  : form.shippingAddress.addressFields.address1.htmlValue,
            address2  : form.shippingAddress.addressFields.address2.htmlValue,
            city      : form.shippingAddress.addressFields.city.htmlValue,
            country   : form.shippingAddress.addressFields.country.htmlValue,
            phone     : form.shippingAddress.addressFields.phone.htmlValue
        };

        if (form.shippingAddress.addressFields.postal) {
            singleShipping.postal = form.shippingAddress.addressFields.postal.htmlValue;
        } else if (form.shippingAddress.addressFields.postalCode) {
            singleShipping.postalCode = form.shippingAddress.addressFields.postalCode.htmlValue;
        }

        session.privacy.singleshipping = JSON.stringify(singleShipping);

        return false;
    }

    try {
        singleShipping = JSON.parse(session.privacy.singleshipping);
    } catch (error) {
        delete session.privacy.singleshipping;
        singleShipping = {};
    };    

    var result = checkFields.every(function (value) {
        return singleShipping[value] === form.shippingAddress.addressFields[value].htmlValue;
    });

    if (!result) {
        checkFields.forEach(function (value) {
            singleShipping[value] = form.shippingAddress.addressFields[value].htmlValue;
        });
    } else {
        delete session.privacy.singleshipping;
        delete session.privacy.VertexAddressSuggestions;
    }
    return result;
}

/**
 *
 * @param {Object} form form with required fielsd
 * @param {dw.order.Basket} cart Basket
 * @param {string} shipmentUUID Id of shipment
 * @returns {boolean} true if request was 200
 */
function LookupTaxAreas(form, cart, shipmentUUID) {
    var inSuggestion;
    var VertexAddressSelectedMult;

    if (session.privacy.VertexAddressSelected === true && cart.shipments.length === 1) {
        return true;
    }
    if (shipmentUUID) {
        try {
            VertexAddressSelectedMult = JSON.parse(session.privacy.VertexAddressSelectedMult) || {};
        } catch (e) {
            VertexAddressSelectedMult = {};
        }
        if (VertexAddressSelectedMult !== null && VertexAddressSelectedMult[shipmentUUID]) {
            var shipments = cart.shipments.iterator();
            var changed = false;
            while (shipments.hasNext()) {
                var sipment = shipments.next();
                if (sipment.UUID === shipmentUUID) {
                    var shipAddress = sipment.getShippingAddress();
                    var checkFields = ['firstName', 'lastName', 'address1', 'city', 'postalCode', 'phone'];
                    var formShipAddress = form.shippingAddress.addressFields;
                    inSuggestion = inSuggestions(formShipAddress);
                    for (var i = 0; i < checkFields.length; i += 1) {
                        var key = checkFields[i];
                        if (shipAddress[key] !== formShipAddress[key].htmlValue) {
                            // check if address is in suggestions
                            changed = true;
                            break;
                        }
                    }
                }
            }

            if (!changed || inSuggestion) {
                return true;
            }
        } else {
            VertexAddressSelectedMult[shipmentUUID] = true;
            session.privacy.VertexAddressSelectedMult = JSON.stringify(VertexAddressSelectedMult);
        }
    }

    var fields;
    if (form.object) {
        if (form.object.shippingAddress) {
            fields = form.object ? form.object.shippingAddress.addressFields : form.shippingAddress.addressFields;
        }
    } else if (form) {
        fields = form.shippingAddress.addressFields;
    }

    var country = fields.country.selectedOption.value || fields.country.selectedOption;
    if (!(country == 'us' || country == 'US')) { // eslint-disable-line eqeqeq
        API.log(constants.INFO_LOG, 'Vertex Lookup Tax Service does not cover "{0}" location', country);
        return true;
    }

    var lookupResult = API.LookupTaxArea(fields, cart);

    if (!lookupResult.result) {
        if (lookupResult.addresses.length) {
            session.privacy.VertexAddressSuggestions = JSON.stringify(filterUniqueAddresses(lookupResult.addresses)); // User-entered address on the top
            delete session.privacy.VertexAddressSuggestionsError;
        } else {
            // We check here if there are no any address suggestions after first trial to pass shipping step and
            // no any changes on form then we var pass to billing step
            // https://vertexsmb.atlassian.net/browse/DEM-13 and https://vertexsmb.atlassian.net/browse/CSFCC-1
            session.privacy.VertexAddressSuggestionsError = 'error';
            if (session.privacy.VertexAddressSuggestionsError) {
                var isFormDataChanged = isFormChanged(form);
                if (isFormDataChanged) {
                    return true;
                }
            }
        }

        if (!constants.SFRA) {
            response.redirect(URLUtils.https('COShipping-Start'));
        } else {
            // response.redirect(URLUtils.https('Checkout-Begin'));
        }
        return false;
    }
    session.privacy.VertexAddressSelected = true;
    delete session.privacy.VertexAddressSuggestions;
    delete session.privacy.VertexAddressSuggestionsError;
    delete session.privacy.VertexAddressSelectedMult;
    return true;
}
/**
 * @returns {boolean} true if Vertex is enabled
 */
function isEnabled() {
    return API.isEnabled;
}

/**
 * Reverses array and removes addresses duplicates from vertex adresses suggests in order to avoid repeatitive selections in template
 * @param {array} addresses array of Addresses
 * @returns {array} array of unique Adresses
 */
function filterUniqueAddresses(addresses) {
    var result = [];
    for (var i = addresses.length - 1; i >= 0; i--) {
        var iteratedAddress = addresses[i];
        if (!result.some(function(resultAddress){
            return iteratedAddress.key === resultAddress.key && iteratedAddress.ID === resultAddress.ID;
        })){
            result.push(iteratedAddress);
        }
    }
    return result;
}

exports.CalculateTax = CalculateTax;
exports.LookupTaxAreas = LookupTaxAreas;
exports.isEnabled = isEnabled;
exports.DeleteTransaction = deleteTransaction;
exports.filterUniqueAddresses = filterUniqueAddresses;
