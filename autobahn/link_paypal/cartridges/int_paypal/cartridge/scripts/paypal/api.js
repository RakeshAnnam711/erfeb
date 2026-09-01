'use strict';

const Money = require('dw/value/Money');
const Resource = require('dw/web/Resource');
const UUIDUtils = require('dw/util/UUIDUtils');
const Transaction = require('dw/system/Transaction');

const utils = require('*/cartridge/scripts/paypal/utils');
const sdkConfig = require('*/cartridge/config/sdkConfig');
const constants = require('*/cartridge/config/constants');
const preferences = require('*/cartridge/config/preferences');
const paypalRestService = require('*/cartridge/scripts/service/paypalREST');

const PATH_CHECKOUT_ORDERS = 'v2/checkout/orders/';
const messageOrderIdNotFound = Resource.msg('paypal.error.api.order.id.notfound', 'paypalerrors', null);

/**
 * Determines the payment intent
 * @param {boolean} isLocalPaymentMethod - Indicates if the payment method is a local payment method
 * @returns {string} The determined payment intent, either CAPTURE or AUTHORIZE
 */
function determinePaymentIntent(isLocalPaymentMethod) {
    const intent = preferences.isCapture ? constants.INTENT_CAPTURE : constants.INTENT_AUTHORIZE;

    return isLocalPaymentMethod ? constants.INTENT_CAPTURE : intent;
}

/**
 * Creates a billing address object for the Order Create Api call.
 *
 * @param {Object} billingAddress - a billing address object.
 * @returns {Object} properly formatted billing address.
 */
function createBillingAddressObject(billingAddress) {
    return {
        address_line_1: billingAddress.address1,
        address_line_2: billingAddress.address2 || '',
        admin_area_2: billingAddress.city,
        admin_area_1: billingAddress.stateCode,
        postal_code: decodeURIComponent(billingAddress.postalCode),
        country_code: billingAddress.countryCode.value
    };
}

/**
 * Returns a payer object for the Order Create Api call
 *
 * @param {Object} billingAddress A billing address object
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr basket/order
 * @returns {Object} A payer object
 */
function createPayerObject(billingAddress, lineItemCtnr) {
    const regExpEmail = new RegExp(constants.REGEXP_EMAIL);

    return {
        name: {
            given_name: billingAddress.firstName,
            surname: billingAddress.lastName
        },
        email_address: regExpEmail.test(lineItemCtnr.customerEmail) ? lineItemCtnr.customerEmail : '',
        phone: {
            phone_number: {
                national_number: billingAddress.phone
            }
        },
        address: createBillingAddressObject(billingAddress)
    };
}

/**
 * Function to get information about an order
 *
 * @param {Object} paymentInstrument - paypalPaymentInstrument
 * @returns {Object} Call handling result
 */
function getOrderDetails(paymentInstrument) {
    try {
        if (!paymentInstrument.custom.paypalOrderID) {
            utils.createErrorLog(messageOrderIdNotFound);

            throw new Error();
        }

        const resp = paypalRestService.call({
            path: PATH_CHECKOUT_ORDERS + paymentInstrument.custom.paypalOrderID,
            method: constants.METHOD_GET,
            body: {},
            authAssertion: true
        });

        if (resp) {
            const result = {
                purchase_units: resp.purchase_units
            };

            if ([constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD, constants.PAYMENT_METHOD_ID_GOOGLE_PAY]
                .includes(paymentInstrument.custom.paymentId)) {
                result.payment_source = resp.payment_source;
            } else {
                result.payer = resp.payer;
                result.payment_source = resp.payment_source;
            }

            return result;
        }

        utils.createErrorLog(Resource.msgf('paypal.error.log.no.payer.info.found', 'paypalerrors', null, paymentInstrument.custom.paypalOrderID));

        throw new Error();
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Function to update information about an order
 *
 * @param {Object} paymentInstrument - paypalPaymentInstrument
 * @param {Object} purchaseUnit - purchase unit
 * @returns {Object} Call handling result
 */
function updateOrderDetails(paymentInstrument, purchaseUnit) {
    try {
        if (!paymentInstrument.custom.paypalOrderID) {
            utils.createErrorLog(messageOrderIdNotFound);

            throw new Error();
        }

        paypalRestService.call({
            path: PATH_CHECKOUT_ORDERS + paymentInstrument.custom.paypalOrderID,
            method: 'PATCH',
            body: [
                {
                    op: 'replace',
                    path: '/purchase_units/@reference_id==\'default\'',
                    value: purchaseUnit
                }
            ],
            authAssertion: true
        });

        if (paymentInstrument.paymentTransaction && paymentInstrument.paymentTransaction.amount.value !== purchaseUnit.amount.value) {
            Transaction.wrap(function() {
                paymentInstrument.paymentTransaction.setAmount(new Money(purchaseUnit.amount.value, purchaseUnit.amount.currency_code));
            });
        }

        return { isOkUpdate: true };
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Function to create transaction
 *
 * @param {Object} paymentInstrument - paypalPaymentInstrument
 * @returns {Object} Call handling result
 */
function createTransaction(paymentInstrument) {
    try {
        if (!paymentInstrument.custom.paypalOrderID) {
            utils.createErrorLog(messageOrderIdNotFound);

            throw new Error();
        }

        const isLocalPaymentMethod = sdkConfig.disableFunds.includes(paymentInstrument.custom.paymentId);
        const actionType = determinePaymentIntent(isLocalPaymentMethod);
        const response = paypalRestService.call({
            path: [PATH_CHECKOUT_ORDERS, paymentInstrument.custom.paypalOrderID, '/', actionType.toLowerCase()].join(''),
            body: {},
            payPalRequestId: UUIDUtils.createUUID(),
            payPalClientMetadataId: session.privacy.clientMetadataId,
            authAssertion: true
        });

        return {
            response: response
        };
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Function to create order exists
 *
 * @param {Object} params - Additional parameters for processing the order
 * @param {Object} params.purchaseUnit - purchaseUnit
 * @param {dw.order.LineItemCtnr} params.lineItemCtnr - lineItemCtnr basket/order
 * @param {boolean} [params.isExpressCheckout] - Flag indicating whether the express checkout is used
 * @param {Object} paymentSourceData The payment source data
 * @returns {Object} Call handling result
 */
function createOrder(params, paymentSourceData) {
    try {
        const { purchaseUnit, lineItemCtnr, isExpressCheckout } = params;

        if (!purchaseUnit) {
            utils.createErrorLog(Resource.msg('paypal.error.log.no.purchase.unit.found', 'paypalerrors', null));

            throw new Error();
        }

        const isLocalPaymentMethod = Boolean(request.httpParameterMap.isLocalPaymentMethod.booleanValue);

        const orderData = {
            path: 'v2/checkout/orders',
            body: {
                intent: determinePaymentIntent(isLocalPaymentMethod),
                purchase_units: [purchaseUnit],
                processing_instruction: constants.NO_INSTRUCTION
            },
            partnerAttributionId: preferences.partnerAttributionId,
            payPalRequestId: UUIDUtils.createUUID(),
            payPalClientMetadataId: session.privacy.clientMetadataId,
            authAssertion: true
        };

        // Adds a payer object to the request. Basically is used for LPM payment method
        if (lineItemCtnr && lineItemCtnr.billingAddress && !(paymentSourceData && paymentSourceData.isLpm)) {
            const regExpPhone = new RegExp(constants.REGEXP_PHONE);
            const billingAddress = lineItemCtnr.billingAddress;

            if (billingAddress.phone && regExpPhone.test(billingAddress.phone.replace(/\s|\(|\)|\+/g, '')) && billingAddress.countryCode) {
                orderData.payer = createPayerObject(billingAddress, lineItemCtnr);
            }
        }

        if (paymentSourceData && !paymentSourceData.isLpm) {
            const paymentSourceHelper = require('*/cartridge/scripts/paypal/helpers/paymentSource');

            paymentSourceHelper.updatePaymentSourceData(paymentSourceData, orderData, {
                lineItemCtnr: lineItemCtnr,
                isExpressCheckout: isExpressCheckout,
                isDigitalGoodsEnabled: preferences.isDigitalGoodsFlowEnabled,
                isStreamlinedCheckout: preferences.isStreamlinedCheckout,
                appSwitchEnabled: preferences.appSwitchEnabled
            });
        }

        const resp = paypalRestService.call(orderData);

        return {
            resp: resp,
            requestBody: orderData.body
        };
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Returns a client token for card fields rendering
 *
 * @returns {string|Object} A client token
 */
function generateClientToken() {
    try {
        const response = paypalRestService.call({
            path: 'v1/identity/generate-token',
            method: constants.METHOD_POST,
            partnerAttributionId: preferences.partnerAttributionId,
            headers: { 'Accept-Language': request.locale }
        });

        return response.client_token; // time life 3600;
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Gets access token according a paypal user authorization code
 *
 * @param {string} authCode Authorization code of paypal user
 * @returns {string} access token
 */
function exchangeAuthCodeForAccessToken(authCode) {
    const result = paypalRestService.call({
        code: authCode,
        requestType: constants.ACCESS_TOKEN,
        path: 'v1/oauth2/token',
        method: constants.METHOD_POST,
        partnerAttributionId: preferences.partnerAttributionId,
        authAssertion: true
    });

    return result.access_token;
}

/**
 * Generates SDK client token
 *
 * @returns {string} SDK client token
 */
function generateSdkClientToken() {
    const result = paypalRestService.call({
        fastlane: true,
        path: 'v1/oauth2/token',
        method: constants.METHOD_POST,
        partnerAttributionId: preferences.partnerAttributionId,
        authAssertion: true
    });

    return result.access_token;
}

/**
 * Generates user id token for PayPal payer
 * @returns {string|Object} A user id token
 */
function generateUserIdToken() {
    try {
        const response = paypalRestService.call({
            userIdToken: true,
            payPalCustomerId: customer.profile.custom.payPalCustomerId || null,
            partnerAttributionId: preferences.partnerAttributionId,
            authAssertion: true
        });

        return response.id_token;
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * Gets paypal customer info according access token
 * @param {string} accessToken Access Token
 * @returns {Object} Object with the customer info
 */
function getPaypalCustomerInfo(accessToken) {
    const userInfo = paypalRestService.call({
        accessToken: accessToken,
        path: 'v1/identity/openidconnect/userinfo?schema=openid',
        method: constants.METHOD_GET
    });

    if (!userInfo.ok) {
        return null;
    }

    const [firstName, middleName, lastName] = userInfo.name.trim().split(/\s+/);

    userInfo.firstName = firstName;
    userInfo.lastName = lastName || middleName;

    userInfo.emailConfirmed = userInfo.email_verified;

    userInfo.addressObjectFromPayPal = {
        id: [constants.LOGIN_PAYPAL, userInfo.address.postal_code].join(' - '),
        address1: userInfo.address.street_address,
        city: userInfo.address.locality,
        countryCode: userInfo.address.country,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        postalCode: userInfo.address.postal_code,
        stateCode: userInfo.address.region,
        phone: Resource.msg('paypal.account.address.phonenumber.notprovided', 'locale', null)
    };

    return userInfo;
}

/**
 * The function creates a setup token for paypal or credit card using PayPal REST API.
 *
 * @param {Object} body - The object that contains payment source for credit card or paypal
 * @returns {Object} - The result of the service call or an object containing the error message.
 */
function createSetupToken(body) {
    const profile = customer.profile;

    if (profile.custom.payPalCustomerId) {
        body.customer = {
            id: profile.custom.payPalCustomerId
        };
    }

    try {
        return paypalRestService.call({
            path: 'v3/vault/setup-tokens',
            method: constants.METHOD_POST,
            body: body,
            paypalRequestId: UUIDUtils.createUUID()
        });
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * The function creates a payment token using a provided token and PayPal customer ID.
 * The retrieved token is used for vaulting and orders creation.
 * @param {string} tokenId - The unique identifier for the specific payment method or payment source.
 * @param {string} tokenType - The type of token to generate.
 * @param {string} payPalCustomerId - The unique identifier for the PayPal customer, used for association of token with customer.
 * @returns {Object} - The result of the service call or an object containing the error message.
 */
function createPaymentToken(tokenId, tokenType, payPalCustomerId) {
    const body = {
        payment_source: {
            token: {
                id: tokenId,
                type: tokenType
            }
        },
        customer: {
            id: payPalCustomerId
        }
    };

    try {
        return paypalRestService.call({
            path: 'v3/vault/payment-tokens',
            method: constants.METHOD_POST,
            body: body,
            paypalRequestId: UUIDUtils.createUUID()
        });
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

/**
 * The function makes a DELETE call to delete the payment token from the PP side.
 *
 * @param {string} token - The unique identifier for the specific payment method or payment source.
 * @returns {Object} - The result of the service call or an object containing the error message.
 */
function deletePaymentToken(token) {
    try {
        return paypalRestService.call({
            path: ['v3/vault/payment-tokens/', token].join(''),
            method: 'DELETE'
        });
    } catch (err) {
        return { err: utils.createErrorMsg(err.message) };
    }
}

module.exports = {
    createTransaction: createTransaction,
    updateOrderDetails: updateOrderDetails,
    getOrderDetails: getOrderDetails,
    createOrder: createOrder,
    exchangeAuthCodeForAccessToken: exchangeAuthCodeForAccessToken,
    getPaypalCustomerInfo: getPaypalCustomerInfo,
    generateClientToken: generateClientToken,
    createSetupToken: createSetupToken,
    createPaymentToken: createPaymentToken,
    deletePaymentToken: deletePaymentToken,
    generateUserIdToken: generateUserIdToken,
    generateSdkClientToken: generateSdkClientToken
};
