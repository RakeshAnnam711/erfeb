'use strict';

const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const Order = require('dw/order/Order');

const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const googlePayHelper = require('*/cartridge/scripts/paypal/helpers/googlePayHelper');
const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
const paypalApi = require('*/cartridge/scripts/paypal/api');
const constants = require('*/cartridge/config/constants');
const paypalProcessorHelper = require('*/cartridge/scripts/paypal/helpers/paypalProcessorHelper');
const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');
const prefs = require('*/cartridge/config/preferences');

/**
 * @param {dw.order.LineItemCtnr} basket - current basket
 * @param {Object} billingForm - billing from
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument
 * @returns {Object} -
 */
function handleOrderIdFlow(basket, billingForm, paymentInstrument) {
    const isPaypalPmUsed = paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL;
    const isSavedPaypalFlow = isPaypalPmUsed && paymentInstrument.creditCardToken !== null;

    Transaction.wrap(function() {
        paymentInstrument.custom.paymentId = billingForm.paypal.usedPaymentMethod.htmlValue;
        paymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;
    });

    if (isSavedPaypalFlow) {
        paypalHelper.setBillingAddressFromPaypal(basket, JSON.parse(paymentInstrument.custom.paypalBillingAddress));

        return {
            shippingAddress: null
        };
    }

    const orderDetails = paypalApi.getOrderDetails(paymentInstrument);

    const {
        payer,
        purchase_units,
        err: OrderDetailsError
    } = orderDetails;

    if (OrderDetailsError) {
        return paypalProcessorHelper.handleOrderDetailsError(OrderDetailsError);
    }

    const validationResult = prefs.isDigitalGoodsFlowEnabled
        ? { error: false }
        : addressHelper.validateCheckoutOrdersPaypalAddresses(orderDetails);

    if (validationResult.error) {
        paypalProcessorHelper.clearCurrentPaypalEmail(paymentInstrument);

        return {
            error: true,
            errorName: validationResult.errorName,
            statusCode: 422,
            fieldErrors: [
                validationResult.fields
            ],
            serverErrors: [
                validationResult.message
            ]
        };
    }

    addressHelper.updateOrderBillingAddress(basket, payer);

    if (prefs.isDigitalGoodsFlowEnabled) {
        addressHelper.setCustomerEmailToBasket(payer.email_address, basket);
    }

    Transaction.wrap(function() {
        paymentInstrument.custom.currentPaypalEmail = payer.email_address;
    });

    // in case of checkout via Venmo or PAYPAL Debit/Credit Card, save its name to payment instrument custom property
    if ([
        constants.PAYMENT_METHOD_ID_VENMO,
        constants.PAYMENT_METHOD_ID_Debit_Credit_Card,
        constants.PAYMENT_METHOD_ID_PAYPAL
    ].includes(billingForm.paypal.usedPaymentMethod.value)) {
        Transaction.wrap(function() {
            paymentInstrument.custom.paymentId = billingForm.paypal.usedPaymentMethod.value;
        });
    }

    session.privacy.paypalPayerEmail = payer.email_address;

    const shippingAddress = purchase_units[0].shipping;

    if (shippingAddress && !shippingAddress.phone_number) {
        shippingAddress.phone = payer.phone;
    }

    if (shippingAddress && !shippingAddress.email_address) {
        shippingAddress.email_address = payer.email_address;
    }

    return {
        shippingAddress: shippingAddress
    };
}

/**
 * Handles the Paypal credit card flow
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {Object} billingForm The billing form
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument
 * @returns {Object} An object
 */
function handleCreditCardFlow(basket, billingForm, paymentInstrument) {
    const billingAddressAsString = paypalHelper.stringifyBillingAddress(basket.billingAddress);

    Transaction.wrap(function() {
        paymentInstrument.custom.paypalCreditCardBillingAddress = billingAddressAsString;
        paymentInstrument.custom.paymentId = billingForm.paypal.usedPaymentMethod.htmlValue;
    });

    if (creditCardHelper.isSavedCardFlow()) {
        return {
            shippingAddress: null
        };
    }

    Transaction.wrap(function() {
        paymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;
        paymentInstrument.custom.payPalSaveCreditCard = billingForm.paypal.saveCreditCardAccount.checked;
    });

    const orderDetails = paypalApi.getOrderDetails(paymentInstrument);

    if (orderDetails.err) {
        return paypalProcessorHelper.handleOrderDetailsError(orderDetails.err);
    }

    const cardData = orderDetails.payment_source.card;
    const threeDSecureCheck = paypalProcessorHelper.process3DSecureResponse(cardData);

    if (threeDSecureCheck && threeDSecureCheck.error) {
        return threeDSecureCheck;
    }

    Transaction.wrap(function() {
        paymentInstrument.creditCardType = creditCardHelper.formatComplexCCBrandCode(cardData.brand.toLowerCase());
        paymentInstrument.creditCardNumber = Date.now().toString().substr(0, 11) + cardData.last_digits;

        if (cardData.expiry) {
            const expiry = cardData.expiry.split('-');

            paymentInstrument.setCreditCardExpirationMonth(parseInt(expiry[1], 10));
            paymentInstrument.setCreditCardExpirationYear(parseInt(expiry[0], 10));
        }
    });

    const purchaseUnits = orderDetails.purchase_units;
    const shippingAddress = prefs.isDigitalGoodsFlowEnabled ? {} : purchaseUnits[0].shipping.address;

    return {
        shippingAddress: shippingAddress
    };
}

/**
 * Handles the Paypal credit card flow via Fastlane
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {Object} billingForm The billing form
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument
 * @returns {Object} An object
 */
function handleFastlaneFlow(basket, billingForm, paymentInstrument) {
    const ppForm = billingForm.paypal;
    const billingAddressAsString = paypalHelper.stringifyBillingAddress(basket.billingAddress);
    const fastlanePaymentToken = ppForm.fastlanePaymentToken.htmlValue;
    const isSessionAccountUsed = !empty(fastlanePaymentToken) && session.privacy.paymentToken
        && (fastlanePaymentToken === session.privacy.paymentToken);

    if (!isSessionAccountUsed) {
        session.privacy.paymentToken = fastlanePaymentToken;

        const cardData = {
            lastDigits: ppForm.fastlaneCardLastDigits.htmlValue,
            expiry: ppForm.fastlaneExpiry.htmlValue,
            brand: ppForm.fastlaneCardType.htmlValue,
            cardHolderName: ppForm.creditCardHolderName.htmlValue
        };

        Transaction.wrap(function() {
            paymentInstrument.custom.paypalCreditCardBillingAddress = billingAddressAsString;
            paymentInstrument.custom.paymentId = ppForm.usedPaymentMethod.htmlValue;

            paymentInstrument.creditCardHolder = cardData.cardHolderName;
            paymentInstrument.creditCardType = creditCardHelper.formatComplexCCBrandCode(cardData.brand.toLowerCase());
            paymentInstrument.creditCardNumber = Date.now().toString().substr(0, 11) + cardData.lastDigits;

            if (cardData.expiry) {
                const expiry = cardData.expiry.split('-');

                paymentInstrument.setCreditCardExpirationMonth(parseInt(expiry[1], 10));
                paymentInstrument.setCreditCardExpirationYear(parseInt(expiry[0], 10));
            }
        });
    }

    return { shippingAddress: {} };
}

/**
 * Processor Handle
 *
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {Object} paymentInformation - paymentForm from hook
 * @returns {Object} Processor handling result
 */
function handle(basket, paymentInformation) {
    let result;

    const billingForm = paymentInformation.billingForm;
    const usedPaymentMethod = billingForm.paypal.usedPaymentMethod.value;
    const isCreditCard = usedPaymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
    const isApplePay = usedPaymentMethod === constants.PAYMENT_METHOD_ID_APPLE_PAY;
    const isGooglePay = usedPaymentMethod === constants.PAYMENT_METHOD_ID_GOOGLE_PAY;

    const paymentInstrument = paypalProcessorHelper.handlePaymentInstrument(basket, billingForm);

    if (isCreditCard) {
        if (paypalHelper.isFastlaneUsed(paymentInstrument)) {
            result = handleFastlaneFlow(basket, billingForm, paymentInstrument);
        } else {
            result = handleCreditCardFlow(basket, billingForm, paymentInstrument);
        }
    } else if (isApplePay) {
        result = paypalProcessorHelper.handleApplePay(basket, billingForm, paymentInstrument);
    } else if (isGooglePay) {
        result = googlePayHelper.handleGooglePay(basket, billingForm, paymentInstrument);
    } else {
        result = handleOrderIdFlow(basket, billingForm, paymentInstrument);
    }

    if (result.error) {
        return result;
    }

    return {
        success: true,
        paymentInstrument: paymentInstrument,
        shippingAddress: result.shippingAddress
    };
}

/**
 * Check Order Validity
 * @param {dw.order.LineItemCtnr} order - Order
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - Payment instrument
 * @returns {Object} - result of checks
 */
function checkOrderValidity(order, paymentInstrument) {
    const result = {
        error: false
    };

    const isInvalid = empty(paymentInstrument) || empty(order) || order.status === Order.ORDER_STATUS_FAILED;

    if (isInvalid || paymentInstrument.paymentTransaction.amount.value === 0) {
        result.error = true;
        result.errorMessage = isInvalid
            ? Resource.msg('paypal.error.general', 'paypalerrors', null)
            : Resource.msg('paypal.error.zeroamount', 'paypalerrors', null);
    }

    return result;
}

/**
 * Handles creating transaction process
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} response or error object
 */
function handleCreateTransaction(paymentInstrument) {
    const {
        response,
        err: createTransactionError
    } = paypalApi.createTransaction(paymentInstrument);

    if (createTransactionError) {
        return {
            error: true,
            serverErrors: [createTransactionError]
        };
    }

    const paypalPaymentStatus = paypalHelper.getTransactionStatus(response);

    if (constants.PAYPAL_CARD_ERROR_STATUSES.includes(paypalPaymentStatus)) {
        return {
            error: true,
            errorMessage: Resource.msg('paypal.creditcard.declined', 'paypalerrors', null)
        };
    }

    if (constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD === paymentInstrument.paymentMethod && paymentInstrument.custom.payPalSaveCreditCard) {
        creditCardHelper.saveCreditCardToCustomerWallet(
            response,
            paymentInstrument.custom.paypalCreditCardBillingAddress
        );
    }

    let savePaypalAccount;

    if (response.payment_source.paypal) {
        savePaypalAccount = response.payment_source.paypal.attributes
            ? response.payment_source.paypal.attributes.vault : null;
    }

    if (constants.PAYMENT_METHOD_ID_PAYPAL === paymentInstrument.paymentMethod && savePaypalAccount) {
        paypalHelper.savePaypalToCustomerWallet(response);
    }

    paypalProcessorHelper.saveGeneralTransactionData(paymentInstrument, response, {}); // Investigate 3d parameter

    return response;
}

/**
 * Save result of rest call and update order data
 *
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} Processor authorizing result
 */
function authorize(order, paymentInstrument) {
    delete session.privacy.paypalUsedOrderNo;

    const orderValidity = checkOrderValidity(order, paymentInstrument);
    const isCreditCardPmUsed = paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
    const isPaypalPmUsed = paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL;
    const isSavedCreditCardFlow = isCreditCardPmUsed && paymentInstrument.creditCardToken !== null;
    const isSavedPaypalFlow = isPaypalPmUsed && paymentInstrument.creditCardToken !== null;
    const paymentTransaction = paymentInstrument.paymentTransaction;
    const purchaseUnit = paypalHelper.getPurchaseUnit(order);

    const OrderDataHash = require('*/cartridge/models/orderDataHash');
    const orderDataHashInstance = new OrderDataHash();

    if (orderValidity.error) {
        return orderValidity;
    }

    if (isSavedCreditCardFlow) {
        creditCardHelper.updateSavedCreditCardBA(paymentInstrument);

        return creditCardHelper.completeSavedCcOrder(purchaseUnit, order, paymentInstrument);
    }

    if (paypalHelper.isFastlaneUsed(paymentInstrument)) {
        return creditCardHelper.completeFastlaneOrder(purchaseUnit, order, paymentInstrument);
    }

    if (isSavedPaypalFlow) {
        return paypalHelper.completeSavedPaypalOrder(purchaseUnit, order, paymentInstrument);
    }

    const isUpdateRequired = paypalHelper.isPurchaseUnitChanged(purchaseUnit, paymentInstrument, orderDataHashInstance.get());

    if (paymentInstrument.custom.paypalOrderID && isUpdateRequired) {
        const paypalOrderDetails = paypalApi.updateOrderDetails(paymentInstrument, purchaseUnit);

        if (paypalOrderDetails.err) {
            return {
                error: true,
                serverErrors: [paypalOrderDetails.err],
                errorMessage: paypalOrderDetails.err
            };
        }

        orderDataHashInstance.set(purchaseUnit);
    }

    Transaction.wrap(function() {
        order.custom.paypalPaymentMethod = constants.PAYPAL_ORDER_INDICATOR;
    });

    const transactionResponse = handleCreateTransaction(paymentInstrument);

    if (transactionResponse.error) {
        return transactionResponse;
    }

    Transaction.wrap(function() {
        order.custom.PP_API_TransactionID = paymentTransaction.transactionID;
    });

    orderDataHashInstance.clear();

    return {
        error: false
    };
}

exports.handle = handle;
exports.authorize = authorize;
