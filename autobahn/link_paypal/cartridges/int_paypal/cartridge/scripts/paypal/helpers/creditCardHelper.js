'use strict';

const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const prefs = require('*/cartridge/config/preferences');
const constants = require('*/cartridge/config/constants');
const paypalApi = require('*/cartridge/scripts/paypal/api');
const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');

/**
 * Returns all applicable PAYPAL_CREDIT_CARD Payment Instruments for current customer
 * @returns {Array} Array of applicable payment instruments of current site
 */
function getApplicablePayPalCcPi() {
    if (!customer.authenticated) {
        return [];
    }

    const customerWalletPaymentInstruments = customer.profile.wallet.paymentInstruments;

    return Array.filter(customerWalletPaymentInstruments, function(paymentInstrument) {
        return paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
    });
}

/**
 * Check is available to another CC
 * @param {List} savedCC array of saved CC
 * @returns {boolean} True/False
 */
function isSavingCreditCardAvailable(savedCC) {
    return prefs.creditCardVaultLimit === constants.CC_SAVE_LIMIT_UNLIMITED
        || prefs.creditCardVaultLimit > savedCC.length;
}

/**
 * Returns a configuration object for card fields generation
 * @param {Object} viewData A view data object
 * @param {dw.order.LineItemCtnr} basket - Basket instance
 * @returns {Object} A card fields config object
 */
function getCardFieldsConfigs(viewData, basket) {
    const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');
    const fastlaneHelpers = require('*/cartridge/scripts/paypal/helpers/fastlane');
    const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');

    const applicableCc = getApplicablePayPalCcPi();

    const expirationCreditCards = applicableCc.reduce(function(accum, creditCard) {
        const data = paymentHelper.getExpirationDataForCC(creditCard);

        if (data) {
            accum[creditCard.UUID] = data;
        }

        return accum;
    }, {});

    const fastlanePaymentToken = session.privacy.paymentToken;
    const paymentInstruments = basket.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);
    const isFastlaneSessionPaymentsEnabled = fastlaneHelpers.isFastlaneSessionPaymentsEnabled();
    const sessionAccount = isFastlaneSessionPaymentsEnabled && fastlanePaymentToken && !empty(paymentInstruments) ? paymentInstruments[0] : null;

    return {
        fieldsConfig: {
            numberHtmlName: viewData.forms.billingForm.creditCardFields.cardNumber.htmlName,
            styles: prefs.cardFieldsStyles
        },
        fieldsPlaceholders: {
            name: Resource.msg('paypal.creditcard.field.cardholder', 'locale', null),
            number: Resource.msg('paypal.creditcard.field.cardNumber.placeholder', 'locale', null),
            cvv: Resource.msg('paypal.creditcard.field.cvv.placeholder', 'locale', null),
            expirationDate: Resource.msg('paypal.creditcard.field.expirationdate.placeholder', 'locale', null)
        },
        fieldsGeneralNotificationError: Resource.msg('paypal.error.creditcard.field.general.notification', 'paypalerrors', null),
        clientToken: paypalApi.generateClientToken(),
        clientSDKToken: paypalApi.generateSdkClientToken(),
        clientMetadataId: basicHelpers.getPpClientMetadataId(),
        creditCardPmId: constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD,
        threeDSecureValue: prefs.threeDSecureFlow,
        isShowCheckbox: customer.authenticated && prefs.creditCardVaultModeEnabled && isSavingCreditCardAvailable(applicableCc),
        customerSavedCreditCards: applicableCc,
        isCreditCardVaultEnabled: !prefs.creditCardVaultModeDisabled,
        expirationCreditCards: expirationCreditCards,
        isNewCardOptionSelected: !applicableCc.some(function(card) {
            return card.custom.payPalDefaultCard;
        }),
        errorMessages: {
            threeDSVerificationFailed: Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null)
        },
        sessionAccount: sessionAccount,
        fastlanePaymentToken: fastlanePaymentToken
    };
}

/**
 * @param {string} brandCode credit card brand code
 * @returns {string} properly formatted variant of credit card brand code
 */
function formatComplexCCBrandCode(brandCode) {
    const creditCardComplexBrandCode = constants.CREDIT_CARD_COMPLEX_BRAND_CODE.find(function(formattedBrandCode) {
        return formattedBrandCode.toLowerCase().includes(brandCode)
            || brandCode.replace(/_/g, ' ').includes(formattedBrandCode.toLowerCase())
            || brandCode.replace(/_/g, '').includes(formattedBrandCode.toLowerCase());
    });

    return creditCardComplexBrandCode || brandCode.replace(brandCode.charAt(0), brandCode.charAt(0).toUpperCase());
}

/**
 * Checks whether is saved credit card used
 * @returns {boolean} True/False
 */
function isSavedCardFlow() {
    const httpParameterMap = request.httpParameterMap;

    return customer.registered && !httpParameterMap.paypalCreditCardList.empty && httpParameterMap.paypalCreditCardList.stringValue !== 'newcard';
}

/**
 * Checking the credit card token for uniqueness
 * @param {dw.customer.Profile} profile - A customer profile
 * @param {string} creditCardToken - Credit card token
 * @returns {boolean} - true if the credit card is unique by creditCardToken, otherwise false
 */
function isUniqueCreditCardToken(profile, creditCardToken) {
    const paymentInstruments = profile.wallet.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD).toArray();

    if (!paymentInstruments.length) {
        return true;
    }

    return paymentInstruments.every(function(paymentInstrument) {
        return paymentInstrument.creditCardToken !== creditCardToken;
    });
}

/**
 * Check if the vault status is VAULTED
 * @param {Object} attributes - Vault credit card attributes
 * @returns {boolean} - True if status = VAULTED, false otherwise.
 */
function isVaultedStatusForCreditCard(attributes) {
    return attributes && attributes.vault.status === constants.CREDIT_CARD_SAVE_STATUS_VAULTED;
}

/**
 * Returns credit card holder name or alternative text
 * @param {Object} cardData - Credit card data from API response.
 * @returns {string} - card holder name
 */
function getCreditCardHolderName(cardData) {
    return cardData.name || Resource.msg('paypal.creditcard.cardholder.notprovided', 'locale', null);
}

/**
 * Saves the Credit card to the customer wallet.
 * @param {Object} responseData - The API response object.
 * @param {string} billingAddressAsString - Stringified billing address to save.
 */
function saveCreditCardToCustomerWallet(responseData, billingAddressAsString) {
    const cardData = responseData.payment_source.card;
    const attributes = cardData.attributes;
    // isMyAccountFlow is true for adding card from account page or VaultPaymentTokenCreatedWebHook
    const isMyAccountFlow = cardData && !attributes;

    if (isVaultedStatusForCreditCard(attributes) || isMyAccountFlow) {
        const profile = customer.profile || customerHelper.getCustomerProfile(responseData.customer.id);

        if (!profile) {
            return;
        }

        const customerWallet = profile.wallet;

        const expiry = cardData.expiry.split('-');
        const isPaymentInstrumentsExist = !empty(customerWallet.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD));
        const makeCardDefault = !isPaymentInstrumentsExist;

        let creditCardToken;
        let customerId;

        if (isMyAccountFlow) {
            creditCardToken = responseData.id;
            customerId = responseData.customer.id;
        } else {
            creditCardToken = attributes.vault.id;
            customerId = attributes.vault.customer.id;
        }

        if (!isUniqueCreditCardToken(profile, creditCardToken)) {
            return;
        }

        Transaction.wrap(function() {
            if (!profile.custom.payPalCustomerId) {
                profile.custom.payPalCustomerId = customerId;
            }

            customerHelper.setPayPalSavedCardsPaymentToken(profile.custom, creditCardToken);

            const customerPaymentInstrument = customerWallet.createPaymentInstrument(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

            customerPaymentInstrument.setCreditCardHolder(getCreditCardHolderName(cardData));
            customerPaymentInstrument.setCreditCardNumber(Date.now().toString().substr(
                constants.CC_NUMBER_LIMIT_NUMBER_START,
                constants.CC_NUMBER_LIMIT_NUMBER_END
            ) + cardData.last_digits);
            customerPaymentInstrument.setCreditCardExpirationMonth(parseInt(expiry[1], 10));
            customerPaymentInstrument.setCreditCardExpirationYear(parseInt(expiry[0], 10));
            customerPaymentInstrument.setCreditCardType(formatComplexCCBrandCode(cardData.brand.toLowerCase()));
            customerPaymentInstrument.creditCardToken = creditCardToken;
            customerPaymentInstrument.custom.payPalDefaultCard = makeCardDefault;
            customerPaymentInstrument.custom.paypalCreditCardBillingAddress = billingAddressAsString;
        });
    }
}

/**
 * The function updates the billing address of a saved credit card payment instrument
 * if it has changed.
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - an order payment instrument.
 * @returns {void}
 */
function updateSavedCreditCardBA(paymentInstrument) {
    const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

    const piToUpdate = paymentInstrumentHelper.getCustomerPiByCreditCardToken(paymentInstrument.creditCardToken);

    if (piToUpdate.custom.paypalCreditCardBillingAddress !== paymentInstrument.custom.paypalCreditCardBillingAddress) {
        Transaction.wrap(function() {
            piToUpdate.custom.paypalCreditCardBillingAddress = paymentInstrument.custom.paypalCreditCardBillingAddress;
        });
    }
}

/**
 * Completes a saved Credit card order (Capture or Authorization)
 * @param {Object} creditCardOrder credit card order data object
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} An object
 */
function completeCcOrder(creditCardOrder, order, paymentInstrument) {
    const paypalProcessorHelper = require('*/cartridge/scripts/paypal/helpers/paypalProcessorHelper');
    const paypalUtils = require('*/cartridge/scripts/paypal/utils');

    let result = {
        authorized: true
    };

    if (creditCardOrder.err) {
        paypalUtils.createErrorLog(creditCardOrder.err);

        result = {
            error: true,
            authorized: false,
            fieldErrors: [],
            serverErrors: [creditCardOrder.err],
            message: creditCardOrder.err
        };
    } else {
        const response = creditCardOrder.resp;

        paypalProcessorHelper.saveGeneralTransactionData(paymentInstrument, response, creditCardOrder.requestBody);

        Transaction.wrap(function() {
            paymentInstrument.custom.paypalOrderID = response.id;
            order.custom.PP_API_TransactionID = paymentInstrument.paymentTransaction.transactionID;
            order.custom.paypalPaymentMethod = constants.PAYPAL_ORDER_INDICATOR;
        });
    }

    return result;
}

/**
 * Completes a saved Credit card order (Capture or Authorization)
 * @param {Object} purchaseUnit A purchase unit object
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} An object
 */
function completeSavedCcOrder(purchaseUnit, order, paymentInstrument) {
    const creditCardOrder = paypalApi.createOrder({
        purchaseUnit: purchaseUnit,
        lineItemCtnr: order
    }, {
        card: {
            vault_id: paymentInstrument.creditCardToken,
            attributes: {}
        }
    });

    return completeCcOrder(creditCardOrder, order, paymentInstrument);
}

/**
 * Returns customer object to be passed into Credit card payment source
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr basket/order
 * @param {Object} paymentSourceData The payment source data
 * @return {Object} An object
 */
function getCustomerData(lineItemCtnr, paymentSourceData) {
    const profile = customer.profile;

    const nationalNumber = prefs.isDigitalGoodsFlowEnabled && paymentSourceData.billingAddressDigitalGoods
        ? paymentSourceData.billingAddressDigitalGoods.phone.phone_number.national_number
        : lineItemCtnr.billingAddress.phone;

    const data = {
        email_address: lineItemCtnr.customerEmail,
        phone: {
            phone_number: {
                // convert to E.164 format
                national_number: nationalNumber.replace(/[^0-9]/g, '')
            }
        }
    };

    if (profile && profile.custom.payPalCustomerId) {
        data.id = profile.custom.payPalCustomerId;
    }

    return data;
}

/**
 * The function returns the verification method based on the value of the custom preference.
 * @returns {string|null} - verification method or null.
 */
function getVerificationMethod() {
    if (prefs.verifyCardOnAccountPage !== constants.DISABLED) {
        return prefs.verifyCardOnAccountPage;
    }

    return null;
}

/**
 * The function retrieves credit card information from a form and returns an object containing the card details.
 * @param {Object} form - The object that represents the form data submitted by the user.
 * @returns {Object} - an object which contains all the properties required for API request.
 */
function getCreditCardFields(form) {
    const paypalUrls = require('*/cartridge/config/urls');
    const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');

    const card = {
        name: form.dwfrm_paypalCreditCard_cardName,
        number: form.dwfrm_paypalCreditCard_cardNumber,
        expiry: form.dwfrm_paypalCreditCard_cardExpirationDate,
        security_code: form.dwfrm_paypalCreditCard_cardSecurityCode,
        billing_address: addressHelper.getBillingAddressFromForm(form),
        experience_context: {
            return_url: paypalUrls.myAccountUrl + '&approveFlow=true',
            cancel_url: paypalUrls.myAccountUrl + '&cancelFlow=true'
        }
    };

    const verificationMethod = getVerificationMethod();

    if (verificationMethod) {
        card.verification_method = verificationMethod;
    }

    return card;
}

/**
 * Prepare form fields for submitting to PP server
 * @param {Object} formFields object with form fields
 * @returns {Object} with prepared form fields
 */
function prepareBodyForCreateSetupToken(formFields) {
    const preparedForm = JSON.parse(JSON.stringify(formFields));

    // prepare card number field
    while (preparedForm.number.includes(' ')) {
        preparedForm.number = preparedForm.number.replace(' ', '');
    }

    // prepare expiration date field
    const [month, expirationYear] = preparedForm.expiry.split(' / ');

    let year = expirationYear;

    if (year.length === 2) {
        const currentYear = new Date().getFullYear().toString();

        year = currentYear.slice(0, 2) + year;
    }

    preparedForm.expiry = [year, month].join('-');

    return {
        payment_source: {
            card: preparedForm
        }
    };
}

/**
 * Returns validation object of card fields on My Account page
 * @param {string} fieldName field name
 * @param {string} fieldValue field value
 * @returns {Object} with the validation results
 */
function validateCardAccountPage(fieldName, fieldValue) {
    const errorObj = {
        isError: true,
        errorMessage: Resource.msg('paypal.error.creditcard.field.invalid', 'paypalerrors', null)
    };

    switch (fieldName) {
        case 'name':
            const regExpName = new RegExp(constants.REGEXP_NAME);

            if (!regExpName.test(fieldValue)) {
                errorObj.fieldName = 'card-holder-name';

                return errorObj;
            }

            break;
        case 'expiry':
            const [year, month] = fieldValue.split('-');
            const cardDate = new Date([month, '01', year].join('/'));
            const currentDate = new Date();

            errorObj.fieldName = 'expiration-date';

            if (parseInt(month) >= 13) {
                return errorObj;
            }

            cardDate.setMonth(cardDate.getMonth() + 1, 1);

            if (cardDate < currentDate) {
                errorObj.errorMessage = Resource.msg('paypal.creditcard.expired', 'paypalerrors', null);

                return errorObj;
            }

            break;
    }

    return {
        isError: false
    };
}

/**
 * The function deletes a specified credit card from a customer's wallet.
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstrumentToDelete - The payment instrument that needs to be deleted from the customer's wallet.
 * @returns {void}
 */
function deleteCreditCardFromWallet(paymentInstrumentToDelete) {
    const wallet = customer.profile.wallet;

    Transaction.wrap(function() {
        customerHelper.deletePayPalSavedCardsPaymentToken(customer.profile.custom, paymentInstrumentToDelete.creditCardToken);

        wallet.removePaymentInstrument(paymentInstrumentToDelete);
    });
}

/**
 * The function sets a new default credit card for a customer if they have any saved credit cards.
 * @returns {void}
 */
function setDefaultCard() {
    const customerSavedCreditCards = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

    if (!empty(customerSavedCreditCards)) {
        const newDefaultCreditCard = customerSavedCreditCards.pop();

        Transaction.wrap(function() {
            newDefaultCreditCard.custom.payPalDefaultCard = true;
        });
    }
}

/**
 * The function retrieves the default PayPal credit card payment instrument for a customer wallet.
 * @returns {dw.customer.CustomerPaymentInstrument|undefined} - the default PayPal credit card payment instrument for the customer.
 */
function getDefaultCard() {
    const customerSavedCreditCards = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD);

    return customerSavedCreditCards.find(function(card) {
        return card.custom.payPalDefaultCard;
    });
}

/**
 * The function modifies order data for credit card in case of enabled 3D Secure by adding extra security fields.
 * @param {Object} orderData - data for order creation
 * @param {Object} paymentSourceData - payment source data
 * @returns {Object} data - data for order creation
 */
function setStoredCredential(orderData, paymentSourceData) {
    const card = paymentSourceData.card;
    const data = {
        payment_initiator: constants.INITIATOR_CUSTOMER,
        payment_type: constants.PAYMENT_TYPE_ONE_TIME,
        usage: constants.USAGE_DERIVED
    };

    if (prefs.creditCardVaultModeEnabled
        && card.attributes.vault
        && card.attributes.vault.store_in_vault === constants.VAULT_INDICATOR_ON_SUCCESS) {
        data.usage = constants.USAGE_FIRST;
    } else if (card.vault_id) {
        data.usage = constants.USAGE_SUBSEQUENT;
    }

    return data;
}

/**
 * The function modifies order data for credit card. It sets customer object into Credit card payment source.
 * And in case of enabled 3D Secure ads extra security fields.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - lineItemCtnr basket/order
 * @param {Object} orderData - data for order creation
 * @param {Object} paymentSourceData - payment source data
 * @returns {Object} paymentSourceData - data for order creation
 */
function processCardData(lineItemCtnr, orderData, paymentSourceData) {
    const isThreeDSecureEnabled = prefs.isThreeDSecureEnabled;

    paymentSourceData.card.attributes.customer = getCustomerData(lineItemCtnr, paymentSourceData);

    if (isThreeDSecureEnabled && paymentSourceData.card) {
        const isSavedCreditCard = lineItemCtnr.paymentInstrument && lineItemCtnr.paymentInstrument.creditCardToken;

        paymentSourceData.card.stored_credential = setStoredCredential(orderData, paymentSourceData);

        if (!isSavedCreditCard) {
            paymentSourceData.card.attributes.verification = {
                method: prefs.threeDSecureFlow
            };

            const paypalUrls = require('*/cartridge/config/urls');

            paymentSourceData.card.experience_context = {
                return_url: paypalUrls.placeOrderStage,
                cancel_url: paypalUrls.paymentStage
            };
        }
    }

    return paymentSourceData;
}

/**
 * Completes a Fastlane order (Capture or Authorization)
 * @param {Object} purchaseUnit A purchase unit object
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} An object
 */
function completeFastlaneOrder(purchaseUnit, order, paymentInstrument) {
    const data = {
        card: {
            single_use_token: paymentInstrument.custom.fastlanePaymentToken || session.privacy.paymentToken
        }
    };

    const creditCardOrder = paypalApi.createOrder({
        purchaseUnit: purchaseUnit,
        lineItemCtnr: order
    }, data);

    const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');

    const paypalPaymentStatus = paypalHelper.getTransactionStatus(creditCardOrder.resp);

    if (constants.PAYPAL_CARD_ERROR_STATUSES.includes(paypalPaymentStatus)) {
        return {
            error: true,
            errorMessage: Resource.msg('paypal.creditcard.declined', 'paypalerrors', null)
        };
    }

    return completeCcOrder(creditCardOrder, order, paymentInstrument);
}

module.exports = {
    formatComplexCCBrandCode: formatComplexCCBrandCode,
    getCardFieldsConfigs: getCardFieldsConfigs,
    isSavedCardFlow: isSavedCardFlow,
    saveCreditCardToCustomerWallet: saveCreditCardToCustomerWallet,
    completeSavedCcOrder: completeSavedCcOrder,
    updateSavedCreditCardBA: updateSavedCreditCardBA,
    getCustomerData: getCustomerData,
    getCreditCardFields: getCreditCardFields,
    deleteCreditCardFromWallet: deleteCreditCardFromWallet,
    setDefaultCard: setDefaultCard,
    getDefaultCard: getDefaultCard,
    prepareBodyForCreateSetupToken: prepareBodyForCreateSetupToken,
    validateCardAccountPage: validateCardAccountPage,
    processCardData: processCardData,
    completeFastlaneOrder: completeFastlaneOrder
};
