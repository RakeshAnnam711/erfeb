'use strict';

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = dw.system.Logger.getLogger('AuthorizeNet','AuthorizeCard');


/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createMockToken() {
    var token = Math.random().toString(36).substr(2);
    return token;
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var collections = require('*/cartridge/scripts/util/collections');
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var cardSecurityCode = paymentInformation.securityCode.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var creditCardStatus;

    var cardType = paymentInformation.cardType.value;
    var paymentCard = PaymentMgr.getPaymentCard(cardType);

    if (!paymentInformation.creditCardToken && paymentCard != null) {
        if (paymentCard.active) {
            creditCardStatus = paymentCard.verify(
                expirationMonth,
                expirationYear,
                cardNumber,
                cardSecurityCode
            );
        } else {
            cardErrors[paymentInformation.cardNumber.htmlName] = Resource.msg('error.invalid.card.number', 'creditCard', null);
            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        if (creditCardStatus.error) {
            collections.forEach(creditCardStatus.items, function (item) {
                switch (item.code) {
                    case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                        cardErrors[paymentInformation.cardNumber.htmlName] = Resource.msg('error.invalid.card.number', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                        cardErrors[paymentInformation.expirationMonth.htmlName] = Resource.msg('error.expired.credit.card', 'creditCard', null);
                        cardErrors[paymentInformation.expirationYear.htmlName] = Resource.msg('error.expired.credit.card', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                        cardErrors[paymentInformation.securityCode.htmlName] = Resource.msg('error.invalid.security.code', 'creditCard', null);
                        break;
                    default:
                        serverErrors.push(Resource.msg('error.card.information.error', 'creditCard', null));
                }
            });

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice);

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        /* don't set until there is a valid tokenization provider
        paymentInstrument.setCreditCardToken(
            paymentInformation.creditCardToken
            ? paymentInformation.creditCardToken
            : createMockToken()
        );
        */
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Transforms AVS code from Authorize.net to a readable message.
 * @param {string} avsResultCode - The AVS code returned in the response
 * @return {string} return matching description
 */
function getAVSMessage(avsResultCode) {
    switch(avsResultCode) {
        case 'A':
            return 'Street Address: Match -- First 5 Digits of ZIP: No Match';
        case 'B':
            return 'Address not provided for AVS check or street address match, postal code could not be verified';
        case 'E':
            return 'AVS Error';
        case 'G':
            return 'Non U.S. Card Issuing Bank';
        case 'N':
            return 'Street Address: No Match -- First 5 Digits of ZIP: No Match';
        case 'P':
            return 'AVS not applicable for this transaction';
        case 'R':
            return 'Retry, System Is Unavailable';
        case 'S':
            return 'AVS Not Supported by Card Issuing Bank';
        case 'U':
            return 'Address Information For This Cardholder Is Unavailable';
        case 'W':
            return 'Street Address: No Match -- All 9 Digits of ZIP: Match';
        case 'X':
            return 'Street Address: Match -- All 9 Digits of ZIP: Match';
        case 'Y':
            return 'Street Address: Match - First 5 Digits of ZIP: Match';
        case 'Z':
            return 'Street Address: No Match - First 5 Digits of ZIP: Match';
        default:
            return 'AVS Result: No message found.';
    }
}

/**
 * Transforms CVV code from Authorize.net to a readable message.
 * @param {string} cvvResultCode - The CVV code returned in the response
 * @return {string} return matching description
 */
function getCVVMessage(cvvResultCode) {
    switch(cvvResultCode) {
        case '900':
            return 'Matched';
        case '901':
            return 'Does not match';
        case '902':
            return 'Should be on the card, but is not indicated';
        case '903':
            return 'The issuer is not certified for CVV processing or has not provided an encryption key';
        case '904':
            return 'Is not processed';
        default:
            return 'CVV Result: No message found.';
    }
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstr, paymentProcessor) {
    var server = require('server');
    var creditCardForm = server.forms.getForm('billing').creditCardFields;
    var serverErrors = [],
        fieldErrors = {},
        authResponse = {},
        error = false;

    var order = OrderMgr.getOrder(orderNumber);
    var creditCardNumber = paymentInstr.getCreditCardNumber();

    if (paymentInstr.maskedCreditCardNumber == creditCardNumber) {
        creditCardNumber = creditCardForm.cardNumber.htmlValue;
    }

    var billingAddress = order.getBillingAddress();
    var shippingAddress = order.getDefaultShipment().shippingAddress;

    try {
        var requestBody = {
            "createTransactionRequest": {
                "merchantAuthentication": {
                    "name": "{apiLoginID}",
                    "transactionKey": "{transactionKey}"
                },
                "refId": orderNumber,
                "transactionRequest": {
                    "transactionType": "authOnlyTransaction",
                    "amount": order.totalGrossPrice.value,
                    "currencyCode": order.currencyCode,
                    "payment": {
                        "creditCard": {
                            "cardNumber": creditCardNumber,
                            "expirationDate": paymentInstr.getCreditCardExpirationYear() + '-' + creditCardForm.expirationMonth.selectedOption,
                            "cardCode": creditCardForm.securityCode.htmlValue
                        }
                    },
                    "profile": {
                        "createProfile": true
                    },
                    "order": {
                        "invoiceNumber": orderNumber
                    },
                    "lineItems": "{lineItems}",
                    "tax": {
                        "amount": order.totalTax.value,
                        "name": "Avalara",
                    },
                    "shipping": {
                        "amount": order.shippingTotalPrice.value,
                        "name": order.defaultShipment.shippingMethod.displayName
                    },
                    "customer": {
                        "id": order.customerNo,
                        "email": order.customerEmail
                    },
                    "billTo": {
                        "firstName": billingAddress.getFirstName(),
                        "lastName": billingAddress.getLastName(),
                        "address": encodeURIComponent(billingAddress.getAddress1()),
                        "city": billingAddress.getCity(),
                        "state": billingAddress.getStateCode(),
                        "zip": billingAddress.getPostalCode(),
                        "country": billingAddress.getCountryCode(),
                        "phoneNumber": billingAddress.getPhone()
                    },
                    "shipTo": {
                        "firstName": shippingAddress.getFirstName(),
                        "lastName": shippingAddress.getLastName(),
                        "address": encodeURIComponent(shippingAddress.getAddress1()),
                        "city": shippingAddress.getCity(),
                        "state": shippingAddress.getStateCode(),
                        "zip": shippingAddress.getPostalCode(),
                        "country": shippingAddress.getCountryCode()
                    },
                    "customerIP": request.getHttpRemoteAddress()
                }
            }
        };

        var productLineItems = order.getProductLineItems().iterator();
        var lineItems = [];
        while (productLineItems.hasNext()) {
            var pli = productLineItems.next();
            var lineItem = {
                'itemId': pli.productID,
                'name': dw.util.StringUtils.truncate(pli.productName, 31, null, ''),
                'quantity': pli.quantityValue,
                'unitPrice': (pli.adjustedPrice.value/pli.quantityValue).toFixed(4)
            };

            lineItems.push('"lineItem": ' + JSON.stringify(lineItem));
        }

        lineItems = '{' + lineItems.join(',') + '}';

        var args = {
            requestBody: requestBody,
            lineItems: lineItems
        };

        var authorizeNetHttpService = require('*/cartridge/scripts/services/authorizeNetHttpService');
        var result = authorizeNetHttpService.call(args);
        if (result.status !== 'OK') {
            serverErrors.push(JSON.parse(result.getErrorMessage()));
            Logger.error('Authorize.NET. Service Failed. Error Messages:' + result.getErrorMessage());
            return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true };
        }

        authResponse = JSON.parse(result.object);
        if (!authResponse.transactionResponse || (authResponse.messages && authResponse.messages.resultCode === 'Error')) {
            error = true;
            var errorCode = '00PS';
            var errorText = '';
            if (authResponse.hasOwnProperty('messages') && authResponse.messages.message) {
                errorCode = authResponse.messages.message[0].code;
                errorText = authResponse.messages.message[0].text;
            }
            serverErrors.push(errorCode + '|' + errorText);
            Logger.error('Authorize.NET. ' + errorCode + ' code returned. The response was:' + errorText);

            Transaction.wrap(function () {
                order.addNote('Authorize.NET. Logic Error', 'Error Code: ' + errorCode + '|' + errorText);
            });

        } else {
            // If an error is returned, fail order and add a note.
            if (authResponse.transactionResponse.hasOwnProperty('errors')) {
                error = true;
                serverErrors.push(authResponse.transactionResponse.errors[0].errorCode +'|'+ authResponse.transactionResponse.errors[0].errorText);
                Logger.error('Authorize.NET. Transaction Error. Error Code: ' + authResponse.transactionResponse.errors[0].errorCode  + ' | Error Message: ' + authResponse.transactionResponse.errors[0].errorText);
                Transaction.wrap(function () {
                    paymentInstr.paymentTransaction.custom.decision = 'DECLINED';
                    order.addNote('Authorize.NET. Transaction Error', 'Error Code: ' + authResponse.transactionResponse.errors[0].errorCode +' | Error Message: '+ authResponse.transactionResponse.errors[0].errorText);
                });
            // If CVV Response does not match, add a flag to Review order and add a note. Order is still processed.
            } else if (authResponse.transactionResponse.cvvResultCode != 900) {
                Transaction.wrap(function () {
                    paymentInstr.paymentTransaction.custom.decision = 'REVIEW';
                    order.addNote('Authorize.NET. CVV Response', 'CVV Code: ' + authResponse.transactionResponse.cvvResultCode +' | CVV Message: '+ getCVVMessage(authResponse.transactionResponse.cvvResultCode));
                });
            }

            // Auth.net reponses logged into the Payment Transaction object.
            Transaction.wrap(function () {
                paymentInstr.paymentTransaction.transactionID = authResponse.transactionResponse.transId;
                paymentInstr.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstr.paymentTransaction.custom.authCode = authResponse.transactionResponse.authCode;
                paymentInstr.paymentTransaction.custom.cardType = authResponse.transactionResponse.accountType;
                paymentInstr.paymentTransaction.custom.networkTransId = authResponse.transactionResponse.networkTransId;
                paymentInstr.paymentTransaction.custom.avsResultCode = authResponse.transactionResponse.avsResultCode;
                paymentInstr.paymentTransaction.custom.avsResultDesc = getAVSMessage(authResponse.transactionResponse.avsResultCode);
            });
        }
    } catch (e) {
        var err = e;
        Logger.error('Exception in AuthorizeNetService {0}', err.message);
        error = true;
        serverErrors = [err];
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, authResponse: authResponse };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createMockToken = createMockToken;
