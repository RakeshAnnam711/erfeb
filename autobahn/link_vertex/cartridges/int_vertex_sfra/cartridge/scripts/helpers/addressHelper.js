'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

/**
 * @description Make js object from the address
 * @param {Object} address - Address
 * @returns {Object} simple js object
 */
function getAddressObject(address) {
    if (address) {
        return {
            address1    : address.address1,
            address2    : address.address2,
            city        : address.city,
            countryCode : {
                displayValue : address.countryCode.displayValue,
                value        : address.countryCode.value
            },
            firstName  : address.firstName,
            lastName   : address.lastName,
            ID         : address.ID,
            phone      : address.phone,
            postalCode : address.postalCode,
            stateCode  : address.stateCode,
            taxnumber  : address.custom.taxnumber
        };
    }
    return null;
}

/**
 * Creates a list of payment instruments for the current user
 * @param {Array} rawPaymentInstruments - current customer's payment instruments
 * @returns {Array} an array of payment instruments
 */
function getPaymentInstruments(rawPaymentInstruments) {
    var paymentInstruments = [];

    if (rawPaymentInstruments.getLength() > 0) {
        var iterator = rawPaymentInstruments.iterator();
        while (iterator.hasNext()) {
            var item = iterator.next();
            paymentInstruments.push({
                creditCardHolder          : item.creditCardHolder,
                maskedCreditCardNumber    : item.maskedCreditCardNumber,
                creditCardType            : item.creditCardType,
                creditCardExpirationMonth : item.creditCardExpirationMonth,
                creditCardExpirationYear  : item.creditCardExpirationYear,
                UUID                      : item.UUID,
                creditCardNumber          : Object.hasOwnProperty.call(item, 'creditCardNumber')
                    ? item.creditCardNumber
                    : null,
                raw: item
            });
        }
    }

    return paymentInstruments;
}

/**
 * Translates global customer object into local object
 * @param {dw.customer.Customer} customer - Global customer object
 * @returns {Object} local instance of customer object
 */
function getCustomerObject(customer) {
    if (!customer || !customer.profile) {
        return {
            raw: customer
        };
    }
    if (!customer.authenticated) {
        return {
            raw         : customer,
            credentials : {
                username: customer.profile.credentials.login
            }
        };
    }
    var preferredAddress = customer.addressBook.preferredAddress;
    var result;
    result = {
        raw     : customer,
        profile : {
            lastName   : customer.profile.lastName,
            firstName  : customer.profile.firstName,
            email      : customer.profile.email,
            phone      : customer.profile.phoneHome,
            customerNo : customer.profile.customerNo
        },
        addressBook: {
            preferredAddress : getAddressObject(preferredAddress),
            addresses        : []
        },
        wallet: {
            paymentInstruments: getPaymentInstruments(customer.profile.wallet.paymentInstruments)
        }
    };
    if (customer.addressBook.addresses && customer.addressBook.addresses.length > 0) {
        for (var i = 0, ii = customer.addressBook.addresses.length; i < ii; i += 1) {
            result.addressBook.addresses.push(getAddressObject(customer.addressBook.addresses[i]));
        }
    }
    return result;
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(address.firstName);
        shippingAddress.setLastName(address.lastName);
        shippingAddress.setAddress1(address.address1);
        shippingAddress.setAddress2(address.address2);
        shippingAddress.setCity(address.city);
        shippingAddress.setPostalCode(address.postalCode);
        shippingAddress.setStateCode(address.stateCode);
        var countryCode = address.countryCode;
        shippingAddress.setCountryCode(countryCode.value);
        shippingAddress.setPhone(address.phone);
        shippingAddress.custom.taxnumber = address.taxnumber;
    });
}
/**
 *
 * @param {Object} address - from where tax number taken
 * @param {Object} shipment - where tax number written
 */
function addTaxNumber(address, shipment) {
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        shippingAddress.custom.taxnumber = address.taxnumber;
    });
}

module.exports = {
    getCustomerObject             : getCustomerObject,
    copyCustomerAddressToShipment : copyCustomerAddressToShipment,
    addTaxNumber                  : addTaxNumber
};
