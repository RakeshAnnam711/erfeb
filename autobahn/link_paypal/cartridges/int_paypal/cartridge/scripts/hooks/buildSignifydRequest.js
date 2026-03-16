'use strict';

/**
 * hook to create signifyd api request payment object
 * @return {Object} an object that contains the signifyd api object
 */
function buildTransaction(paymentInstrument, order) {
    // we don't want paypal going to signifyd
    return null;

    var result =  {
        checkoutPaymentDetails: {
            holderName: order.billingAddress.fullName,
            billingAddress: {
                streetAddress: order.billingAddress.address1,
                unit: order.billingAddress.address2 || '',
                city: order.billingAddress.city,
                provinceCode: order.billingAddress.stateCode,
                postalCode: order.billingAddress.postalCode,
                countryCode: order.billingAddress.countryCode.value.toUpperCase()
            }
        }
    };

    result.gateway = paymentInstrument.paymentMethod;
    result.type = 'AUTHORIZATION';
    result.paymentMethod = 'PAYPAL_ACCOUNT'
    result.currency = order.currencyCode;

    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }
        if (paymentInstrument.paymentTransaction.custom.authorizePaymentResult) {
            var paypalData = JSON.parse(paymentInstrument.paymentTransaction.custom.authorizePaymentResult);
            if (paypalData && paypalData.authResponse) {
                paypalData = paypalData.authResponse;
                if (paypalData.purchase_units && paypalData.purchase_units.length && paypalData.purchase_units[0].payments && paypalData.purchase_units[0].payments.authorizations && paypalData.purchase_units[0].payments.authorizations.length) {
                    if (paypalData.purchase_units[0].payments.authorizations[0].id) {
                    result.transactionId = paypalData.purchase_units[0].payments.authorizations[0].id;
                    }
                    if (paypalData.purchase_units[0].payments.authorizations[0].create_time) {
                        result.createdAt = paypalData.purchase_units[0].payments.authorizations[0].create_time;
                    }
                    if (paypalData.purchase_units[0].payments.authorizations[0].status) {
                        // https://developer.paypal.com/docs/api/payments/v2/#definition-authorization_status_details
                        switch (paypalData.purchase_units[0].payments.authorizations[0].status) {
                            case 'CREATED':
                            case 'PARTIALLY_CAPTURED':
                            case 'CAPTURED': {
                                result.gatewayStatusCode = 'SUCCESS';
                                break;
                            }
                            case 'PENDING': {
                                result.gatewayStatusCode = 'PENDING';
                                break;
                            }
                            default: {
                                result.gatewayStatusCode = 'FAILURE';
                                break;
                            }
                        }
                    }
                    if (paypalData.purchase_units[0].payments.authorizations[0].seller_protection) {
                        if (paypalData.purchase_units[0].payments.authorizations[0].seller_protection.status) {
                            result.paypalProtectionEligibility = paypalData.purchase_units[0].payments.authorizations[0].seller_protection.status;
                        }
                        if (paypalData.purchase_units[0].payments.authorizations[0].seller_protection.dispute_categories) {
                            if (paypalData.purchase_units[0].payments.authorizations[0].seller_protection.dispute_categories.length == 2) {
                                result.paypalProtectionEligibilityType = 'ITEM_NOT_RECEIVED_ELIGIBLE,UNAUTHORIZED_PAYMENT_ELIGIBLE';
                            } else if (paypalData.purchase_units[0].payments.authorizations[0].seller_protection.dispute_categories.length) {
                                switch (paypalData.purchase_units[0].payments.authorizations[0].seller_protection.dispute_categories[0]) {
                                    case 'ITEM_NOT_RECEIVED': {
                                        result.paypalProtectionEligibilityType = 'ITEM_NOT_RECEIVED_ELIGIBLE';
                                        break;
                                    }
                                    case 'UNAUTHORIZED_TRANSACTION': {
                                        result.paypalProtectionEligibilityType = 'UNAUTHORIZED_PAYMENT_ELIGIBLE';
                                        break;
                                    }
                                    default: {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}

exports.buildTransaction = buildTransaction;
