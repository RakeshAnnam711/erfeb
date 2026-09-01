'use strict';

const prefs = require('*/cartridge/config/preferences');
const sdkConfig = require('*/cartridge/config/sdkConfig');

const googlePayHelper = {};

/**
 * Retrieves the allowed country codes based on the site's allowed locales.
 * If no allowed locales are found, defaults to `['US']`.
 * @returns {string[]} An array of allowed country codes.
 */
function getAllowedCountryCodes() {
    const Site = require('dw/system/Site');

    const locales = Site.current.allowedLocales.toArray();
    const countries = locales.reduce(function(accum, locale) {
        if (locale !== 'default' && locale.includes('_')) {
            accum.push(locale.split('_')[1]);
        }

        return accum;
    }, []);

    return countries.length === 0 ? ['US'] : countries;
}

/**
 * Creates and returns the GooglePay configs object
 * @param {string} endpointName page name for button style
 * @return {Object} GooglePay configs object
 */
googlePayHelper.getGooglePayConfigs = function(endpointName) {
    const Resource = require('dw/web/Resource');
    const paypalUtils = require('~/cartridge/scripts/paypal/utils');
    const paypalUrls = require('*/cartridge/config/urls');
    const buttonConfigHelper = require('~/cartridge/scripts/paypal/helpers/buttonConfigHelper');

    if (!prefs.isGooglePayActive) {
        return undefined;
    }

    let buttonStyle = paypalUtils.tryParseJSON(prefs.googlePayStyles);

    buttonStyle = buttonStyle ? buttonStyle[endpointName] : {};

    return {
        sdkUrl: sdkConfig.googlePaySdk,
        instanceType: buttonConfigHelper.getInstanceType(),
        buttonStyle: buttonStyle,
        googleMerchantId: prefs.googleMerchantId,
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedCountryCodes: getAllowedCountryCodes(),
        getAmountForShippingOptionUrl: paypalUrls.getAmountForShippingOption,
        messages: {
            THREE_DS_VERIFICATION_FAILED: Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null),
            INTERNAL_GOOGLE_PAY_ERROR_MESSAGE: Resource.msg('google.pay.internal.error', 'locale', null),
            SHIPPING_ADDRESS_UNSERVICEABLE: Resource.msg('google.pay.address.unservicable.error', 'locale', null),
            SHIPPING_OPTION_INVALID: Resource.msg('google.pay.shipping.option.invalid', 'locale', null),
            PHONE_NUMBER_INVALID: Resource.msg('paypal.error.googlepay.phone.number.invalid', 'paypalerrors', null)
        },
        pageFlow: endpointName
    };
};

/**
 * Retrieves the Google Pay form fields object
 * @param {Object} billingForm billing form
 * @returns {Object} The Google Pay form fields object
 */
googlePayHelper.getGooglePayFormFields = function(billingForm) {
    const fields = ['googlePayEmailAddress', 'googlePayBillingAddressAsString', 'googlePayShippingAddressAsString'];

    const fieldsData = {
        usedPaymentMethod: {
            name: billingForm.paypal.usedPaymentMethod.htmlName
        },
        paymentMethod: {
            name: billingForm.paymentMethod && billingForm.paymentMethod.htmlName
        }
    };

    return fields.reduce(function(accum, curr) {
        accum[curr] = billingForm.paypal.googlePay && billingForm.paypal.googlePay[curr] ? {
            name: billingForm.paypal.googlePay[curr].htmlName
        } : undefined;

        return accum;
    }, fieldsData);
};

/**
 * Returns the well formatted shipping address object for GP
 * @param {Object} shippingAddress The shipping address object
 * @returns {Object} A prepared shipping address object
 */
googlePayHelper.prepareShippingAddressFromGooglePay = function(shippingAddress) {
    return {
        shipping: {
            name: {
                full_name: shippingAddress.name
            },
            address: {
                country_code: shippingAddress.countryCode,
                address_line_1: shippingAddress.address1,
                address_line_2: shippingAddress.address2,
                postal_code: shippingAddress.postalCode,
                admin_area_1: shippingAddress.administrativeArea,
                admin_area_2: shippingAddress.locality

            }
        },
        phone: {
            phone_number: {
                national_number: shippingAddress.phoneNumber
            }
        }
    };
};

/**
 * Add 3DSecure data to create Google Pay order request if needed
 * @param {Object} paymentSourceData payment source data to create Google Pay order
 * @return {Object} updated paymentSourceData
 */
googlePayHelper.processGooglePayData = function(paymentSourceData) {
    if (prefs.isThreeDSecureEnabled) {
        paymentSourceData.google_pay.attributes = {
            verification: {
                method: prefs.threeDSecureFlow
            }
        };
    }

    return paymentSourceData;
};

/**
 * Handles the GooglePay in handle hook
 * @param {dw.order.LineItemCtnr} basket - current basket
 * @param {Object} billingForm - billing from
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument
 * @returns {Object} The shipping address object
 */
googlePayHelper.handleGooglePay = function(basket, billingForm, paymentInstrument) {
    const Transaction = require('dw/system/Transaction');

    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
    const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
    const paypalApi = require('*/cartridge/scripts/paypal/api');
    const paypalProcessorHelper = require('*/cartridge/scripts/paypal/helpers/paypalProcessorHelper');

    const email = billingForm.paypal.googlePay.googlePayEmailAddress.value;

    Transaction.wrap(function() {
        paymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;
        paymentInstrument.custom.currentPaypalEmail = email;
        paymentInstrument.custom.paymentId = billingForm.paypal.usedPaymentMethod.value;
    });

    session.privacy.paypalPayerEmail = email;

    const orderDetails = paypalApi.getOrderDetails(paymentInstrument);

    if (orderDetails.err) {
        return paypalProcessorHelper.handleOrderDetailsError(orderDetails.err);
    }

    const cardData = orderDetails.payment_source.google_pay.card;
    const threeDSecureCheck = paypalProcessorHelper.process3DSecureResponse(cardData);

    if (threeDSecureCheck && threeDSecureCheck.error) {
        return threeDSecureCheck;
    }

    const googlePayBillingAddress = JSON.parse(billingForm.paypal.googlePay.googlePayBillingAddressAsString.value);
    const splittedFullName = paypalHelper.splitFullName(googlePayBillingAddress.name);

    addressHelper.updateOrderBillingAddress(basket, {
        address: addressHelper.parseBillingAddress(googlePayBillingAddress),
        phone: {
            phone_number: {
                national_number: googlePayBillingAddress.phoneNumber
            }
        },
        name: {
            given_name: splittedFullName.firstName,
            surname: splittedFullName.lastName
        }
    });

    if (prefs.isDigitalGoodsFlowEnabled) {
        addressHelper.setCustomerEmailToBasket(email, basket);

        return { shippingAddress: {} };
    }

    return {
        shippingAddress: Object.assign(
            orderDetails.purchase_units[0].shipping,
            { email_address: email }
        )
    };
};

module.exports = googlePayHelper;
