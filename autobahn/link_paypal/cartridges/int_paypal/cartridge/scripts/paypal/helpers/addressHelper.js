'use strict';

const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');
const paypalConstants = require('*/cartridge/config/constants');

/**
 * @param {dw.order.Basket} basket - current user's basket
 * @returns {void}
 */
function updateShippingMethodsList(basket) {
    const shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    const shipment = basket.defaultShipment;
    const orderAddress = shipment.getShippingAddress();

    let shippingMethodID;
    let shippingAddressObj;

    if (shipment.shippingMethod) {
        shippingMethodID = shipment.shippingMethod.ID;
    }

    if (orderAddress) {
        shippingAddressObj = {
            city: orderAddress.getCity(),
            stateCode: orderAddress.getStateCode(),
            countryCode: orderAddress.getCountryCode(),
            postalCode: orderAddress.getPostalCode()
        };
    }

    const isShippingMethodApplicable = shippingHelpers.getApplicableShippingMethods(shipment, shippingAddressObj).find(function(shippingMethod) {
        return shippingMethod.ID === shippingMethodID;
    });

    if (isShippingMethodApplicable || !shippingMethodID) {
        shippingHelpers.selectShippingMethod(shipment, shippingMethodID);
        basketCalculationHelpers.calculateTotals(basket);
    } else {
        throw new Error(Resource.msg('paypal.shippingoption.invalid.error', 'paypalerrors', null));
    }
}

/**
 * Returns formatted phone number
 * @param {Object} phoneNumber Object with phone's country code and national number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumberWithCountryCode(phoneNumber) {
    const countryCode = phoneNumber.country_code ? ['+', phoneNumber.country_code].join('') : '';

    return [countryCode, phoneNumber.national_number].join('');
}

const addressHelper = {};

/**
 * Returns Object with first, second, last names from a simple string person name
 *
 * @param {string} name Person Name
 * @returns {Object} person name Object
 */
addressHelper.createPersonNameObject = function(name) {
    const nameNoLongSpaces = name.trim().replace(/\s+/g, ' ').split(' ');
    const personNameObject = {
        firstName: null,
        lastName: null
    };

    if (nameNoLongSpaces.length === 1) {
        personNameObject.firstName = name;
    } else if (nameNoLongSpaces.length === 2) {
        personNameObject.firstName = nameNoLongSpaces[0];
        personNameObject.lastName = nameNoLongSpaces[1];
    } else {
        personNameObject.firstName = nameNoLongSpaces.slice(0, 2).join(' ');
        personNameObject.lastName = nameNoLongSpaces.slice(2).join(' ');
    }

    return personNameObject;
};

/**
 * Sets customer preferred address in the PayPal BA/Order id flow address format
 * @param {Object} basket basket
 * @returns {Object} address object
 */
addressHelper.setAddressInPPAddressFormat = function(basket) {
    if (!customer.addressBook || customer.addressBook.addresses.empty) {
        throw new Error(Resource.msg('paypal.addressbook.empty.error', 'paypalerrors', null));
    }

    const customerPreferredAddress = basicHelpers.getPreferredAddress(basket);

    return {
        country_code: customerPreferredAddress.getCountryCode(),
        admin_area_2: customerPreferredAddress.getCity(),
        address_line_1: customerPreferredAddress.getAddress1(),
        address_line_2: customerPreferredAddress.getAddress2(),
        postal_code: customerPreferredAddress.getPostalCode(),
        admin_area_1: customerPreferredAddress.getStateCode()
    };
};

/**
 * Update Billing Address for order with order id
 * @param  {dw.order.Basket} basket - Current users's basket
 * @param  {Object} billingAddress user's billing address
 */
addressHelper.updateOrderBillingAddress = function(basket, billingAddress) {
    if (!billingAddress || typeof billingAddress !== 'object') {
        return;
    }

    let name = billingAddress.name || {};

    const address = billingAddress.address || {};
    const phone = billingAddress.phone || {};

    if (typeof name === 'string') {
        name = addressHelper.createPersonNameObject(name);
    }

    Transaction.wrap(function() {
        const billing = basket.getBillingAddress() || basket.createBillingAddress();

        billing.setFirstName(name.given_name || name.firstName || '');
        billing.setLastName(name.surname || name.lastName || '');
        billing.setCountryCode(address.country_code);
        billing.setCity(address.admin_area_2 || '');
        billing.setAddress1(address.address_line_1 || '');
        billing.setAddress2(address.address_line_2 || '');
        billing.setPostalCode(decodeURIComponent(address.postal_code) || '');
        billing.setStateCode(address.admin_area_1 || '');
        billing.setPhone((phone.phone_number && phone.phone_number.national_number) || (billing.phone || ''));
    });
};

/**
 * Update Shipping Address for order with order id
 * @param  {dw.order.Basket} basket basket - Current users's basket
 * @param  {Object} shippingInfo - user's shipping address
 */
addressHelper.updateOrderShippingAddress = function(basket, shippingInfo) {
    const fullShippingName = shippingInfo.name.full_name;
    const fullName = addressHelper.createPersonNameObject(fullShippingName);
    const shippingAddress = shippingInfo.address;
    const orderShipping = shippingAddress || this.setAddressInPPAddressFormat(basket);

    Transaction.wrap(function() {
        const shipping = basket.getDefaultShipment().getShippingAddress() || basket.getDefaultShipment().createShippingAddress();

        shipping.setCountryCode(orderShipping.country_code);
        shipping.setCity(basicHelpers.getValueByKey(orderShipping, 'admin_area_2', ''));
        shipping.setAddress1(basicHelpers.getValueByKey(orderShipping, 'address_line_1', ''));
        shipping.setAddress2(basicHelpers.getValueByKey(orderShipping, 'address_line_2', ''));
        shipping.setPostalCode(decodeURIComponent(basicHelpers.getValueByKey(orderShipping, 'postal_code') || ''));
        shipping.setStateCode(basicHelpers.getValueByKey(orderShipping, 'admin_area_1', ''));

        if (shippingInfo.phone) {
            shipping.setPhone(basicHelpers.getValueByKey(shippingInfo, 'phone.phone_number.national_number', ''));
        } else {
            shipping.setPhone(formatPhoneNumberWithCountryCode(shippingInfo.phone_number));
        }

        if (!empty(fullName.firstName)) {
            shipping.setFirstName(basicHelpers.getValueByKey(fullName, 'firstName', ''));
        }

        if (!empty(fullName.lastName)) {
            shipping.setLastName(basicHelpers.getValueByKey(fullName, 'lastName', ''));
        }

        updateShippingMethodsList(basket);
    });
};

/**
 * Creates shipping address
 * @param {Object} shippingAddress - user's shipping address
 * @returns {Object} with created shipping address
 */
addressHelper.createShippingAddress = function(shippingAddress) {
    const stateCode = shippingAddress.stateCode === 'undefined' ? '' : shippingAddress.stateCode;

    return {
        name: {
            full_name: shippingAddress.fullName
        },
        address: {
            address_line_1: shippingAddress.address1,
            address_line_2: shippingAddress.address2,
            admin_area_1: stateCode,
            admin_area_2: shippingAddress.city,
            postal_code: decodeURIComponent(shippingAddress.postalCode),
            country_code: shippingAddress.countryCode.value.toUpperCase()
        }
    };
};

/**
 * Returns shipping address object from provided HTTP parameter map with shippings fields
 * @param {dw.web.HttpParameterMap} httpParameterMap A map of HTTP parameters.
 * @returns {Object} A Shipping address object
 */
addressHelper.getShippingAddressFromHttpParameterMap = function(httpParameterMap) {
    return {
        address1: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_address1').value,
        city: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_city').value,
        countryCode: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_country').value,
        firstName: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_firstName').value,
        lastName: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_lastName').value,
        postalCode: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_postalCode').value,
        stateCode: httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_states_stateCode').value
    };
};

/**
 * @param {Object} addressData - the address data
 * @returns {Object} - the prepared address object
 */
function prepareAddressData(addressData) {
    return {
        addressId: addressData.addressId,
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        address1: addressData.line1,
        address2: addressData.line2 || '',
        city: addressData.city,
        postalCode: decodeURIComponent(addressData.postalCode || addressData.postal_code),
        countryCode: addressData.countryCode || addressData.country_code,
        stateCode: addressData.stateCode,
        phone: addressData.phone.replace(/-/g, '')
    };
}

/**
 * @param {Object} payload - the payload data
 * @returns {Object} - the prepared shipping address object
 */
addressHelper.prepareShippingAddressData = function(payload) {
    const shippingAddress = payload.shippingAddress;

    shippingAddress.addressId = paypalConstants.SHIPPING_ADDRESS_ID;
    shippingAddress.phone = payload.phone;
    shippingAddress.lastName = payload.lastName;
    shippingAddress.firstName = payload.firstName;
    shippingAddress.stateCode = shippingAddress.state;

    return prepareAddressData(shippingAddress);
};

/**
 * @param {Object} form - the target of address form (billing, shipping)
 * @param {Object} data - the data for validation process
 * @param {Array} [fieldsToNotValidate] - optional array of fields to not validate
 * @returns {Object} - an object that contain the error in the form
 */
addressHelper.validateAddressForm = function(form, data, fieldsToNotValidate) {
    const AddressValidatorModel = require('*/cartridge/models/addressValidator');

    form.clear();
    form.copyFrom(data);
    form.country.value = data.countryCode;

    if (form.states) {
        form.states.stateCode.value = data.stateCode || data.state;
    }

    const addressValidator = new AddressValidatorModel(form);

    addressValidator.setFieldsToNotValidate(fieldsToNotValidate);

    return addressValidator.validate();
};

/**
 * @returns {Object} - returns an address form object
 */
function getFormAddress() {
    return require('server').forms.getForm('address');
}

/**
 * @param {Object} data - the data for validation process
 * @param {Object} [form] - the target of address form (billing, shipping)
 * @returns {Object} - an object that contain the error in the form
 */
addressHelper.validateShippingAddressForm = function(data, form) {
    if (!form) {
        form = getFormAddress();
    }

    const shippingData = this.prepareShippingAddressData(data);
    const shippingFields = this.validateAddressForm(form, shippingData);

    return {
        error: Object.keys(shippingFields).length > 0,
        errorName: 'shipping.address.invalid',
        fields: shippingFields,
        message: Resource.msg('paypal.error.shipping.address.invalid', 'paypalerrors', null)
    };
};

/**
 * @param {Object} address - the data to be converted
 * @returns {Object} - the result of address data conversion
 */
function convertCheckoutOrdersPaypalAddress(address) {
    return {
        line1: address.address_line_1,
        line2: basicHelpers.getValueOr(address.address_line_2, ''),
        city: address.admin_area_2,
        state: basicHelpers.getValueOr(address.admin_area_1, ''),
        postalCode: address.postal_code,
        countryCode: address.country_code
    };
}

/**
 * @param {Object} data - the data to prepare the output
 * @returns {Object} - the prepared checkout orders paypal addresses object
 */
function prepareForCheckoutOrdersPaypalAddresses(data) {
    const billingData = basicHelpers.getValueByKey(data, 'payer.address', {});
    const shippingData = basicHelpers.getValueByKey(data, 'purchase_units.0.shipping', {});
    const shippingFullName = addressHelper.createPersonNameObject(shippingData.name.full_name);

    const billingAddress = convertCheckoutOrdersPaypalAddress(billingData);
    const shippingAddress = convertCheckoutOrdersPaypalAddress(shippingData.address);
    const phoneNumber = shippingData && shippingData.phone_number
        ? formatPhoneNumberWithCountryCode(shippingData.phone_number)
        : basicHelpers.getValueByKey(data, 'payer.phone.phone_number.national_number', '');

    return {
        billingAddress: billingAddress,
        shippingAddress: shippingAddress,
        phone: phoneNumber,
        lastName: basicHelpers.getValueByKey(data, 'payer.name.surname', shippingFullName.lastName),
        firstName: basicHelpers.getValueByKey(data, 'payer.name.given_name', shippingFullName.firstName)
    };
}

/**
 * @param {Object} data - the data for validation process
 * @param {boolean} [verify] - an optional flag for validation or not
 * @returns {Object} - an object that contain the error in the form
 */
addressHelper.validateCheckoutOrdersPaypalAddresses = function(data, verify) {
    const result = {
        error: false
    };

    if (verify === false) {
        return result;
    }

    const payload = prepareForCheckoutOrdersPaypalAddresses(data);
    const addressForm = getFormAddress();

    const validationShippingResult = addressHelper.validateShippingAddressForm(payload, addressForm);

    if (validationShippingResult.error) {
        return validationShippingResult;
    }

    return result;
};

/**
 * Returns an array of the PayPal shipping address error codes
 * @param {Object} errorObject Contains the errors from the Address validator
 * @returns {Array} The array of the shipping address error codes
 */
function getPayPalShippingAddressErrorCodes(errorObject) {
    const errorKeys = Object.keys(errorObject);

    return errorKeys.map(function(key) {
        switch (key.split('_').pop()) {
            case paypalConstants.ADDRESS_FORM_FIELD_COUNTRY:
                return paypalConstants.PAYPAL_SHIPPING_COUNTRY_ERROR_CODE;
            case paypalConstants.ADDRESS_FORM_FIELD_STATE:
                return paypalConstants.PAYPAL_SHIPPING_STATE_ERROR_CODE;
            case paypalConstants.ADDRESS_FORM_FIELD_POSTAL_CODE:
                return paypalConstants.PAYPAL_SHIPPING_ZIP_ERROR_CODE;
            default:
                return paypalConstants.PAYPAL_SHIPPING_ADDRESS_ERROR_CODE;
        }
    });
}

/**
 * Validates whether the PayPal shipping address is valid and user can proceed to Checkout page (Used only for EC flow)
 * @param {Object} shippingAddress Shipping address from PayPal
 * @returns {Object} Shipping address validation result object
 */
addressHelper.validatePayPalShippingAddress = function(shippingAddress) {
    const result = {
        error: false
    };

    // The shipping address from PayPal contains only: stateCode, postalCode, countryCode, city fields
    const fieldsToNotValidate = ['lastName', 'firstName', 'phone', 'address1', 'address2'];

    const addressForm = getFormAddress();

    shippingAddress.addressId = paypalConstants.SHIPPING_ADDRESS_ID;

    const validationShippingResult = addressHelper.validateAddressForm(addressForm, shippingAddress, fieldsToNotValidate);

    if (Object.keys(validationShippingResult).length > 0) {
        result.error = true;
        result.errorCodes = getPayPalShippingAddressErrorCodes(validationShippingResult);
    }

    return result;
};

/**
 * Applies the free shipping method to the basket according the basket currencyCode
 * @param {dw.order.Basket} basket The current basket
 */
addressHelper.applyOnlinePickupShippingMethodToBasket = function(basket) {
    const checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    const onlinePickupShippingMethod = shippingHelpers.getOnlinePickupShippingMethod(basket.currencyCode);

    Transaction.wrap(function() {
        basket.defaultShipment.setShippingMethod(onlinePickupShippingMethod);
    });

    checkoutHelpers.recalculateBasket(basket);
};

/**
 * Compare addresses
 * @param {Object} address1 - first address object
 * @param {Object} address2 - second address object
 * @return {boolean} true if addresses are the same
 */
addressHelper.compareShippingAddresses = function(address1, address2) {
    let isSame = true;

    Object.keys(address1).forEach(function(key) {
        if (key === 'phone') {
            return;
        }

        if (basicHelpers.isObject(address1[key])) {
            if (!addressHelper.compareShippingAddresses(address1[key], address2[key])) {
                isSame = false;
            }
        } else if (address1[key] !== address2[key]) {
            isSame = false;
        }
    });

    return isSame;
};

/**
 * Creates a payload object with shipping addresses from address book
 * @param {Object} addressBookAddress - addressBook preferredAddress object
 * @return {Object} payload object
 */
addressHelper.generateShippingAddressesPayloadFromAddressBook = function(addressBookAddress) {
    return {
        firstName: addressBookAddress.firstName,
        lastName: addressBookAddress.lastName,
        phone: addressBookAddress.phone,
        shippingAddress: {
            city: addressBookAddress.city,
            countryCode: addressBookAddress.countryCode.value.toUpperCase(),
            state: addressBookAddress.stateCode,
            line1: addressBookAddress.address1,
            postalCode: addressBookAddress.postalCode
        }
    };
};

/**
 * creates a short shipping address object from address book
 * @return {Object} short shipping address object
 */
addressHelper.getPreferredShippingAddressShortObj = function() {
    const shipping = customer.addressBook.preferredAddress;

    return {
        city: shipping.city,
        country_code: shipping.countryCode.value.toUpperCase(),
        line1: shipping.address1,
        phone: shipping.phone,
        postal_code: shipping.postalCode,
        recipient_name: shipping.fullName,
        state: shipping.stateCode
    };
};

/**
 * Updates shipping address if needed to change
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} shippingAddress - The shipping address object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - Payment instrument
 * @returns {void}
 */
addressHelper.updateShippingAddress = function(currentBasket, shippingAddress, paymentInstrument) {
    if (paymentInstrument.custom.paypalOrderID) {
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

        if (!paypalHelper.hasOnlyGiftCertificates(currentBasket)) {
            addressHelper.updateOrderShippingAddress(currentBasket, shippingAddress);
        }
    }
};

/**
 * The function returns billing address in appropriate format for API request.
 * @param {Object} form - The form object that contains all required fields.
 * @returns {Object} - properly formatted billing address object.
 */
addressHelper.getBillingAddressFromForm = function(form) {
    return {
        address_line_1: form.dwfrm_address_address1,
        address_line_2: form.dwfrm_address_address2 || '',
        admin_area_1: form.dwfrm_address_states_stateCode,
        admin_area_2: form.dwfrm_address_city,
        postal_code: decodeURIComponent(form.dwfrm_address_postalCode),
        country_code: form.dwfrm_address_country
    };
};

/**
 * The function returns billing address in appropriate format for saving in PI custom attribute.
 * @param {Object} form - The form object that contains all required fields.
 * @returns {Object} - properly formatted billing address object.
 */
addressHelper.getBillingAddressToSave = function(form) {
    return {
        firstName: form.dwfrm_address_firstName,
        lastName: form.dwfrm_address_lastName,
        address1: form.dwfrm_address_address1,
        address2: form.dwfrm_address_address2 || '',
        city: form.dwfrm_address_city,
        stateCode: form.dwfrm_address_states_stateCode,
        postalCode: decodeURIComponent(form.dwfrm_address_postalCode),
        countryCode: { value: form.dwfrm_address_country },
        phone: form.dwfrm_address_phone
    };
};

/**
 * Update order billing address for Digital Goods (Pay Now) flow
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @returns {void}
 */
addressHelper.updateOrderBillingAddressForDigitalGoodsFlow = function(currentBasket) {
    const prefs = require('*/cartridge/config/preferences');
    const paypalApi = require('*/cartridge/scripts/paypal/api');

    const hasNoBillingAddress = !currentBasket.billingAddress || !currentBasket.billingAddress.address1;

    if (prefs.isDigitalGoodsFlowEnabled && hasNoBillingAddress && session.privacy.paypalOrderID) {
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

        const paymentInstrument = { custom: { paypalOrderID: session.privacy.paypalOrderID } };

        const orderDetails = paypalApi.getOrderDetails(paymentInstrument);
        const billingAddress = paypalHelper.getBillingAddressFromPaymentSource(orderDetails);

        addressHelper.updateOrderBillingAddress(currentBasket, billingAddress);
    }
};

/**
 * The function returns billing address for PayPal type from GooglePay
 * @param {Object} address - The form object that contains all required fields.
 * @returns {Object} - properly formatted billing address object.
 */
addressHelper.parseBillingAddress = function(address) {
    return {
        country_code: address.countryCode,
        address_line_1: address.address1,
        address_line_2: address.address2,
        admin_area_1: address.administrativeArea,
        admin_area_2: address.locality,
        postal_code: address.postalCode
    };
};

/**
 * Sets email address to the current basket
 * @param {string} email Email address
 * @param {dw.order.Basket} basket Current basket
 */
addressHelper.setCustomerEmailToBasket = function(email, basket) {
    if (basket.customerEmail) {
        return;
    }

    Transaction.wrap(function() {
        basket.setCustomerEmail(basket.customer.authenticated
            ? basket.customer.profile.email : email);
    });
};

module.exports = addressHelper;
