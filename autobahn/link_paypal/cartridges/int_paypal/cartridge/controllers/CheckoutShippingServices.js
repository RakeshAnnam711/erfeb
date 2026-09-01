'use strict';

const server = require('server');

server.extend(module.superModule);

server.append('SubmitShipping', function(req, res, next) {
    if (res.viewData.error) {
        return next();
    }

    const preferences = require('*/cartridge/config/preferences');
    const loginPayPalAddressHelper = require('*/cartridge/scripts/paypal/helpers/loginPayPalAddressHelper');

    const httpParameterMap = req.httpParameterMap;
    const newPhoneNumber = httpParameterMap.get('dwfrm_shipping_shippingAddress_addressFields_phone').value;

    // Updates a customer address from 'Connect with paypal feature' (LIPP-login-PayPal) with phone number
    if (newPhoneNumber) {
        const lippAddress = customer.addressBook ? loginPayPalAddressHelper.getCWPPCustomerAddress() : null;
        const isLippAddressUsed = lippAddress !== null && loginPayPalAddressHelper.isCWPPAddressUsedOnCheckoutPage(lippAddress, httpParameterMap);

        if (isLippAddressUsed && lippAddress.phone === null) {
            loginPayPalAddressHelper.savePhoneNumberInCWPPAddress(lippAddress, newPhoneNumber);
        }
    }

    const shippingAddress = res.viewData.address;

    // Mock for Digital Goods (Pay Now) flow to skip shipping stage
    if (preferences.isDigitalGoodsFlowEnabled) {
        [
            'address1', 'city', 'firstName', 'lastName', 'phone',
            'stateCode', 'countryCode', 'postalCode'
        ].forEach(function(key) {
            if (!shippingAddress[key]) {
                shippingAddress[key] = '';
            }
        });
    }

    return next();
});

module.exports = server.exports();
