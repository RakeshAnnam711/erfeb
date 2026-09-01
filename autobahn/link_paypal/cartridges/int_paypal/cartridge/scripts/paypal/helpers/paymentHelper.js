'use strict';

const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');

const prefs = require('*/cartridge/config/preferences');
const constants = require('*/cartridge/config/constants');

const paymentHelper = {};

/**
 * Calculate amount of gift certificates in the order
 * @param {dw.order.Order|dw.order.Basket} lineItemCntr Order or basket object
 * @return {dw.value.Money} Certificates total
 */
paymentHelper.calculateAppliedGiftCertificatesAmount = function(lineItemCntr) {
    const Money = require('dw/value/Money');
    const amount = new Money(0, lineItemCntr.getCurrencyCode());

    return lineItemCntr.giftCertificatePaymentInstruments.toArray().reduce(function(accum, curr) {
        accum.add(curr.getPaymentTransaction().getAmount());

        return accum;
    }, amount);
};

/**
 * Calculate amount
 * @param {dw.order.Order|dw.order.Basket} lineItemCntr Order or basket object
 * @return {dw.value.Money} New Amount value
 */
paymentHelper.getAmountPaid = function(lineItemCntr) {
    const appliedGiftCertificatesAmount = paymentHelper.calculateAppliedGiftCertificatesAmount(lineItemCntr);

    return lineItemCntr.getTotalGrossPrice().subtract(appliedGiftCertificatesAmount);
};

/**
 * Get a credit card expiration data
 * @param {Object} creditCard - Credit card information from Payment Instrument
 * @returns {Object|null} - Credit card expiration data
 */
paymentHelper.getExpirationDataForCC = function(creditCard) {
    const Resource = require('dw/web/Resource');
    const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');

    const creditCardData = {};
    const isCcExpireNotification = prefs.creditCardExpireNotification !== -1;
    const monthDiff = basicHelpers.getExpirationMonthDiff(creditCard.creditCardExpirationYear, creditCard.creditCardExpirationMonth);

    if (isCcExpireNotification && monthDiff <= prefs.creditCardExpireNotification) {
        creditCardData.expireNotification = true;
        creditCardData.expireStyle = constants.FLASH_MESSAGE_WARNING;

        const isCreditCardExpired = creditCard.creditCardExpired === true || monthDiff < 0;

        if (isCreditCardExpired) {
            creditCardData.expireStyle = constants.FLASH_MESSAGE_DANGER;
            creditCardData.expireMessage = Resource.msg('paypal.creditcard.expired', 'paypalerrors', null);
        } else if (monthDiff === 0 && prefs.creditCardExpireNotification > 0) {
            creditCardData.expireMessage = Resource.msg('paypal.creditcard.expires.thismonth', 'paypalerrors', null);
        } else if (monthDiff > 0) {
            creditCardData.expireMessage = Resource.msgf('paypal.creditcard.expires',
                'paypalerrors',
                null,
                monthDiff,
                basicHelpers.pluralize(monthDiff, 'month'));
        }
    }

    return Object.keys(creditCardData).length > 2 ? creditCardData : null;
};

/**
 * Get Expiration Notification For Credit Card
 * @param {Object} notificationObj - Notification object
 * @param {Object} ccExpirationData - Credit Card expiration information
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstrument - Customer Payment Instrument
 * @returns {void}
 */
paymentHelper.getExpirationNotificationForCC = function(notificationObj, ccExpirationData, paymentInstrument) {
    if (!ccExpirationData.expireNotification) {
        return;
    }

    const Resource = require('dw/web/Resource');
    const CustomerModel = require('*/cartridge/models/customer');

    if (ccExpirationData.expireStyle === CustomerModel.FLASH_MESSAGE_DANGER && session.custom.ccExpiredNotice) {
        notificationObj.type = CustomerModel.FLASH_MESSAGE_DANGER;
        notificationObj.message = Resource.msg('creditcard.notification.expired', 'account', null);

        delete session.custom.ccExpiredNotice;
    }

    const CustomerPaymentInstrument = require('dw/customer/CustomerPaymentInstrument');

    const isCustomerPaymentInstrument = paymentInstrument instanceof CustomerPaymentInstrument;

    const expirationNotice = isCustomerPaymentInstrument ? paymentInstrument.custom.paypalCreditCardExpirationNotice : null;

    if (!expirationNotice
        && ccExpirationData.expireStyle === CustomerModel.FLASH_MESSAGE_WARNING
        && notificationObj.type !== CustomerModel.FLASH_MESSAGE_DANGER) {
        notificationObj.type = CustomerModel.FLASH_MESSAGE_WARNING;
        notificationObj.message = Resource.msg('creditcard.notification.expiresoon', 'account', null);

        if (isCustomerPaymentInstrument) {
            Transaction.wrap(function() {
                paymentInstrument.custom.paypalCreditCardExpirationNotice = true;
            });
        }
    }
};

/**
 * Add a credit card expiration data
 * @param {Object} creditCard - Credit card information from Payment Instrument
 */
paymentHelper.addExpirationDataForCC = function(creditCard) {
    const ccExpirationData = paymentHelper.getExpirationDataForCC(creditCard);

    if (ccExpirationData) {
        Object.assign(creditCard, ccExpirationData);
    }
};

/**
 * Add a credit card expiration notification
 * @param {Array} creditCardList - List of credit cards
 * @returns {void}
 */
paymentHelper.addExpirationNotificationForCC = function(creditCardList) {
    if (!creditCardList.length) {
        return;
    }

    const flashNotification = {};

    session.custom.ccExpiredNotice = true;

    creditCardList.forEach(function(creditCard) {
        const ccExpirationData = paymentHelper.getExpirationDataForCC(creditCard);

        if (ccExpirationData) {
            paymentHelper.getExpirationNotificationForCC(flashNotification, ccExpirationData, creditCard);
        }
    });

    if (Object.keys(flashNotification).length) {
        const CustomerModel = require('*/cartridge/models/customer');

        const customerInstance = new CustomerModel(customer);

        Transaction.wrap(function() {
            customerInstance.addFlashMessage(flashNotification.message, flashNotification.type);
        });
    }
};

/**
 * Check if PayLater banner, PayPal button, Google Pay or Apple Pay button is enabled.
 * @param {string} targetPage button location value
 * @param {string} elementType element type
 * @return {boolean} disabled or enabled
 */
paymentHelper.isElementEnabled = function(targetPage, elementType) {
    if (!targetPage || !elementType) {
        return false;
    }

    let displayPages;

    switch (elementType) {
        case constants.APPLE_PAY_BUTTON_LOCATION:
            displayPages = prefs.applePayButtonLocation.toLowerCase();

            break;
        case constants.PAYPAL_BUTTON_LOCATION:
            displayPages = prefs.paypalButtonLocation.toLowerCase();

            break;
        case constants.PAYPAL_BUTTON_MESSAGE:
            displayPages = prefs.paypalButtonMessagesLocation.toLowerCase();

            break;
        case constants.VENMO_BUTTON_LOCATION:
            displayPages = prefs.venmoButtonLocation.toLowerCase();

            break;
        case constants.GOOGLE_PAY_BUTTON_LOCATION:
            displayPages = prefs.googlePayButtonLocation.toLowerCase();

            break;
        default:
            return false;
    }

    return displayPages.split(',').filter(Boolean).includes(targetPage);
};

/**
 * Creates and returns the Apple pay configs object
 * @param {string} pageFlow Current page flow
 * @returns {Object} The Apple pay configs object
 */
paymentHelper.getApplePayConfigs = function(pageFlow) {
    const Resource = require('dw/web/Resource');
    const sdkConfig = require('~/cartridge/config/sdkConfig');

    const requiredShippingContactFields = ['phone', 'email'];

    let buttonColor = 'black';
    let buttonType = 'pay';

    if (constants.PAGE_FLOW_BILLING !== pageFlow && !prefs.isDigitalGoodsFlowEnabled) {
        requiredShippingContactFields.push('name', 'postalAddress');
    }

    if (pageFlow in sdkConfig.applePayButtonConfig) {
        buttonColor = sdkConfig.applePayButtonConfig[pageFlow].buttonStyle;
        buttonType = sdkConfig.applePayButtonConfig[pageFlow].type;
    }

    return {
        applePayLabel: prefs.merchantName,
        applePayTotalType: constants.APPLE_PAY_TOTAL_TYPE_FINAL,
        errorMessages: {
            applePayCancelled: Resource.msg('applepay.popup.cancelled', 'locale', null),
            applePayMerchantVerificationFailed: Resource.msg('applepay.popup.merchant.verification.failed', 'locale', null),
            applePayPaymentMethodVerificationFailed: Resource.msg('applepay.popup.payment.method.verification.failed', 'locale', null),
            couldNotAddProductToTheCart: Resource.msg('applepay.could.not.add.product', 'locale', null)
        },
        buttonConfigs: {
            locale: request.locale,
            color: buttonColor,
            type: buttonType
        },
        sdk: prefs.applePaySdk,
        paymentMethodId: constants.PAYMENT_METHOD_ID_APPLE_PAY,
        tabImageAlt: constants.APPLE_PAY_TAB_IMAGE_ALT,
        // The Apple Pay version number from Paypal documentation
        applePayVersion: 4,
        requiredBillingContactFields: ['name', 'phone', 'email', 'postalAddress'],
        requiredShippingContactFields: requiredShippingContactFields,
        flow: pageFlow,
        lineItemsLabels: {
            subTotal: Resource.msg('applepay.lineitems.subtotal', 'locale', null),
            shipping: Resource.msg('applepay.lineitems.shipping', 'locale', null),
            tax: Resource.msg('applepay.lineitems.tax', 'locale', null)
        },
        isDigitalGoodsEnabled: prefs.isDigitalGoodsFlowEnabled,
        getAmountForShippingOptionUrl: URLUtils.url('Paypal-GetAmountForShippingOption').toString()
    };
};

/**
* Creates config object for Fastlane
* @returns {string} Fastlane config object in string
*/
paymentHelper.createFastlaneConfig = function() {
    const fastlaneStyleOptions = require('~/cartridge/config/fastlaneStyleOptions');

    return JSON.stringify({
        styles: prefs.isFastlanePaymentUiEnabled ? fastlaneStyleOptions.component : fastlaneStyleOptions.flexible
    });
};

/**
 * Returns a new array of payment instruments sorted by lastModified in descending order
 * @param {Array<dw.customer.CustomerPaymentInstrument>} paymentInstruments - Customer payment instruments
 * @returns {Array<dw.customer.CustomerPaymentInstrument>} - Sorted customer payment instruments
 */
paymentHelper.sortPaymentInstrumentsByLastModifiedDesc = function(paymentInstruments) {
    return paymentInstruments.slice().sort(function(a, b) {
        return b.lastModified.getTime() - a.lastModified.getTime();
    });
};

/**
 * Filters and keeps only valid credit cards in the customer.customerPaymentInstruments array.
 * A card is considered valid if it has an expiration year, expiration month, and a masked credit card number.
 * Modifies the customer object in place.
 * @param {Object} customer - The customer object with a customerPaymentInstruments array.
 */
paymentHelper.filterValidCustomerCreditCards = function(customer) {
    if (!Array.isArray(customer.customerPaymentInstruments)) {
        return;
    }

    customer.customerPaymentInstruments = customer.customerPaymentInstruments.filter(function(instrument) {
        return Boolean(instrument.creditCardExpirationYear
            && instrument.creditCardExpirationMonth
            && instrument.maskedCreditCardNumber
        );
    });
};

/**
 * Indicates whether the Venmo is enabled for provided page
 * @param {string} page Current page
 * @returns {boolean} True/False
 */
paymentHelper.isVenmoEnabled = function(page) {
    return prefs.isVenmoEnabled
        && paymentHelper.isElementEnabled(page, constants.VENMO_BUTTON_LOCATION);
};

module.exports = paymentHelper;
