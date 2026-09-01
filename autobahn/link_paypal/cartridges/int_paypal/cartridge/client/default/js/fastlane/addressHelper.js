'use strict';

const fastlaneHelper = require('./fastlaneHelper');
const parsePhoneNumber = require('./parsePhoneNumber');

/**
 * Fill in the billing phone number field
 * @param {string} value - Phone number value
 */
function setBillingPhoneNumber(value) {
    const phoneNumberEl = fastlaneHelper.getElementById('phoneNumber');

    if (phoneNumberEl && phoneNumberEl.value !== value) {
        phoneNumberEl.value = value;
    }
}

/**
 * Get phone number from shipping section
 * @returns {string} - shipping phone number
 */
function getShippingPhone() {
    return document.querySelector('.shippingPhoneNumber')?.value || '';
}

/**
 * Get phone number from billing section
 * @returns {string} - billing phone number
 */
function getBillingPhone() {
    return document.getElementById('phoneNumber')?.value || getShippingPhone();
}

/**
 * Get address fields
 * @returns {Object} - An object with field: selector
 */
function getAddressFields() {
    return {
        firstName: 'input[name$=_firstName]',
        lastName: 'input[name$=_lastName]',
        address1: 'input[name$=_address1]',
        address2: 'input[name$=_address2]',
        city: 'input[name$=_city]',
        postalCode: 'input[name$=_postalCode]',
        stateCode: 'select[name$=_stateCode],input[name$=_stateCode]',
        countryCode: 'select[name$=_country]',
        phone: 'input[name$=_phone]'
    };
}

/**
 * Returns address properties from a UI form
 * @param {Form} form - the Form element
 * @returns {Object} - a JSON object with all values
 */
function getAddressFieldsFromUI(form) {
    return Object.entries(getAddressFields()).reduce((address, [fieldName, fieldSelector]) => {
        address[fieldName] = form.querySelector(fieldSelector).value;

        return address;
    }, {});
}

/**
 * Formats address to appropriate object
 * @param {Object} addressData - address data object
 * @returns {Object} - address formatted object
 */
function formatAddress(addressData) {
    return {
        addressLine1: addressData.address1,
        addressLine2: addressData.address2,
        adminArea2: decodeURIComponent(addressData.city),
        adminArea1: addressData.stateCode,
        postalCode: decodeURIComponent(addressData.postalCode),
        countryCode: decodeURIComponent(addressData.countryCode),
        phone: parsePhoneNumber(addressData.phone)
    };
}

/**
 * Formats billing address from storefront to appropriate object
 * @returns {Object} - billingAddress formatted object
 */
function formatBillingAddress() {
    return {
        billingAddress: formatAddress(getAddressFieldsFromUI(document.getElementById('dwfrm_billing')))
    };
}

/**
 * Formats shipping address from storefront to appropriate object
 * @returns {Object} - shippingAddress formatted object
 */
function formatShippingAddress() {
    const addressData = getAddressFieldsFromUI(document.getElementById('dwfrm_shipping'));

    return {
        address: formatAddress(addressData),
        name: {
            firstName: addressData.firstName,
            lastName: addressData.lastName,
            fullName: [addressData.firstName, addressData.lastName]
                .filter((field) => !!field)
                .join(' ')
        },
        phoneNumber: parsePhoneNumber(addressData.phone)
    };
}

/**
 * Show address data on shipping block
 * @param {Object} address - address data object
 * @param {HTMLElement|null} fastlaneAddressEl - Fastlane address block, where shipping address from account is shown
 */
function setAddress(address, fastlaneAddressEl) {
    if (!address || !fastlaneAddressEl) {
        return;
    }

    const fields = {
        '.fastlane-name': `${address.firstName} ${address.lastName}`,
        '.fastlane-street': address.address1,
        '.fastlane-city': address.city,
        '.fastlane-state': address.stateCode,
        '.fastlane-postal-code': address.postalCode,
        '.fastlane-phone-number': address.phone
    };

    Object.entries(fields).forEach(([selector, value]) => {
        const element = fastlaneAddressEl.querySelector(selector);

        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * Modifies address data object to match SFRA address object
 * @param {Object} addressData - address data object
 * @param {string|Object} nameData - string with name or name data object
 * @param {string} phoneNumber - phone number
 * @returns {Object} - updated address object
 */
function prepareAddressData(addressData, nameData, phoneNumber) {
    if (!addressData) {
        return {};
    }

    let firstName = addressData.name?.firstName || nameData?.firstName;
    let lastName = addressData.name?.lastName || nameData?.lastName;

    if ((!firstName || !lastName) && nameData) {
        const customerName = fastlaneHelper.splitFullName(nameData);

        firstName = customerName.firstName;
        lastName = customerName.lastName;
    }

    const addressPhoneNumber = addressData.phoneNumber;
    const formattedPhoneNumber = phoneNumber?.countryCode && phoneNumber?.nationalNumber
        ? `${phoneNumber.countryCode}${phoneNumber.nationalNumber}`
        : phoneNumber;

    const phone = addressPhoneNumber ? `${addressPhoneNumber.countryCode}${addressPhoneNumber.nationalNumber}` : formattedPhoneNumber;

    if (addressData.address) {
        addressData = addressData.address;
    }

    return {
        firstName: firstName,
        lastName: lastName,
        address1: addressData.addressLine1 || addressData.streetAddress,
        address2: addressData.addressLine2 || addressData.extendedAddress || '',
        stateCode: addressData.adminArea1 || addressData.region,
        country: addressData.countryCode || addressData.countryCodeAlpha2,
        city: addressData.adminArea2 || addressData.locality,
        postalCode: addressData.postalCode,
        phone: phone
    };
}

/**
 * Updates the address form values with address received from Fastlane side
 * @param {HTMLElement} form - shipping/billing form element
 * @param {Object} addressData - address
 */
function updateAddressFormValues(form, addressData) {
    const inputNames = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'phone'];

    if (!form || !addressData) {
        return;
    }

    inputNames.forEach((fieldName) => {
        form.querySelector(`input[name$=_${fieldName}]`).value = decodeURIComponent(addressData[fieldName]);
    });

    // Process the address select elements (Country, State)
    ['select[name$=_stateCode]', 'input[name$=_stateCode]', 'select[name$=_country]', 'input[name$=_country]']
        .forEach((selector) => {
            const element = form.querySelector(selector);

            if (element) {
                element.value = selector.includes('stateCode') ? addressData.stateCode : addressData.country;
            }
        });
}

/**
 * Returns a billing address represented as a string
 * @param {Object} billingAddress A billing address object
 * @returns {string} A string represented a billing address
 */
function formatBillingAddressAsString(billingAddress) {
    const firstName = billingAddress.firstName || '';
    const lastName = billingAddress.lastName || '';
    const address1 = billingAddress.line1 || billingAddress.address1 || billingAddress.streetAddress || '';
    const address2 = billingAddress.line2 || billingAddress.address2 || billingAddress.extendedAddress || '';
    const city = billingAddress.city || billingAddress.locality || '';
    const state = billingAddress.state || billingAddress.stateCode || billingAddress.region || '';
    const postalCode = billingAddress.postalCode ? decodeURIComponent(billingAddress.postalCode) : '';

    return `${firstName} ${lastName} ${address1} ${address2} ${city}, ${state} ${postalCode}`;
}

/**
 * Handles billing address update with address received from Fastlane card data
 * @param {Object} billingAddress - billing address data
 */
function handleBillingAddressUpdate(billingAddress) {
    if (!billingAddress) {
        return;
    }

    updateAddressFormValues(document.querySelector('form[name=dwfrm_billing]'), billingAddress);

    const addressOption = Array.from(fastlaneHelper.getElementById('billingAddressSelector').options)
        .find((option) => !['new', '- Existing Shipments -'].includes(option.value));

    if (addressOption) {
        addressOption.selected = true;
        addressOption.textContent = formatBillingAddressAsString(billingAddress);
        addressOption.value = window.paypalConstants.SESSION_CARD;

        const phoneNumber = (billingAddress.phone || billingAddress.phone?.nationalNumber) || getShippingPhone() || addressOption.dataset.phone;

        setBillingPhoneNumber(phoneNumber);
    }
}

/**
 * Handles address update: updates specific form with prepared address and set address to specific container
 * @param {HTMLElement} form - specific form to update
 * @param {Object} address - address which should be set to form and specific container
 * @param {HTMLElement} addressContainer - specific container where updated address should be set
 */
function handleAddressUpdate(form, address, addressContainer) {
    updateAddressFormValues(form, address);
    setAddress(address, addressContainer);
}

/**
 * Gets card holder name
 * @return {string} - card holder name
 */
function getCardholderName() {
    const { firstName, lastName } = getAddressFieldsFromUI(document.getElementById('dwfrm_shipping'));

    return `${firstName} ${lastName}`;
}

module.exports = {
    formatBillingAddress,
    formatShippingAddress,
    prepareAddressData,
    formatBillingAddressAsString,
    handleBillingAddressUpdate,
    handleAddressUpdate,
    getShippingPhone,
    getBillingPhone,
    getCardholderName,
    getAddressFieldsFromUI
};
