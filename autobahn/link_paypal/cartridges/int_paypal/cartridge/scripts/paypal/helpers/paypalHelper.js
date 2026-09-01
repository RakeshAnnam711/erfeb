'use strict';

const server = require('server');

const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');
const Money = require('dw/value/Money');
const StringUtils = require('dw/util/StringUtils');
const TaxMgr = require('dw/order/TaxMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');

const paypalPreferences = require('*/cartridge/config/preferences');
const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
const constants = require('*/cartridge/config/constants');
const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');

/**
 * Create purchase unit description based on items in the basket
 * @param  {dw.order.ProductLineItem} productLineItems Items in the basket
 * @returns {string} item description
 */
function getItemsDescription(productLineItems) {
    if (productLineItems.length === 0) {
        return '';
    }

    return Array.map(productLineItems, function(productLineItem) {
        return productLineItem.productName;
    }).join(',').substring(0, 127);
}

/**
 * Returns a flag whether 'Returning customer experience' is enabled (available to be shown)
 * @param {boolean} isExpressCheckout - is expressCheckout flag
 * @returns {boolean} a boolean representing whether 'Change payment method button' is enabled
 */
function isReturningCustomerExperienceEnabled(isExpressCheckout) {
    if (customer.authenticated) {
        const customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL);
        const isReturningCustomerEnabled = Boolean(
            customerSavedPaypalAccounts.length
            && paypalPreferences.returningCustomerExperienceEnabled
            && paypalPreferences.isPayPalPmActive
        );

        return isExpressCheckout ? Boolean(isReturningCustomerEnabled && customer.addressBook.preferredAddress) : isReturningCustomerEnabled;
    }

    return false;
}

/**
 * Updates purchase unit object with shipping address and shipping preference details
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {boolean} isExpressCheckout - is expressCheckout flag
 * @param {Object} purchaseUnit - purchase unit object
 * @returns {Object} returns updated purchase unit object and shipping address data
 */
function getShippingDetails(currentBasket, isExpressCheckout, purchaseUnit) {
    const {
        defaultShipment,
        productLineItems,
        giftCertificateLineItems,
        customer
    } = currentBasket;

    let shippingAddress;

    const isReturningCustomerEnabled = isReturningCustomerExperienceEnabled(isExpressCheckout);

    if ((productLineItems.empty && !giftCertificateLineItems.empty) || paypalPreferences.isDigitalGoodsFlowEnabled) {
        return purchaseUnit;
    }

    if (!isExpressCheckout && defaultShipment && defaultShipment.getShippingAddress()) {
        shippingAddress = addressHelper.createShippingAddress(defaultShipment.getShippingAddress());

        purchaseUnit.shipping = shippingAddress;
    } else if (isReturningCustomerEnabled) {
        shippingAddress = currentBasket.shipments[0].shippingAddress || customer.addressBook.preferredAddress;

        purchaseUnit.shipping = addressHelper.createShippingAddress(shippingAddress);
    }

    return purchaseUnit;
}

/**
 * Create purchase unit description based on gifts in the basket
 * @param  {dw.order.LineItemCtnr} giftCertificateLineItems Items in the basket
 * @returns {string} gift description
 */
function getGiftCertificateDescription(giftCertificateLineItems) {
    if (giftCertificateLineItems.length === 0) {
        return '';
    }

    return Array.map(giftCertificateLineItems, function(giftCertLineItem) {
        return [giftCertLineItem.lineItemText, ' for ', giftCertLineItem.recipientEmail].join('');
    }).join(',').substring(0, 127);
}

/**
 * @param  {dw.value.Money} acc current basket order + product discount
 * @param  {dw.order.OrderPaymentInstrument} giftCertificate GC from the basket
 * @returns {dw.value.Money} Gift certificate total
 */
function getAppliedGiftCertificateTotal(acc, giftCertificate) {
    return acc.add(giftCertificate.paymentTransaction.amount);
}

/**
 * @param  {dw.util.Collection} allProductLineItems all items in the basket
 * @param {string} currencyCode currency code string
 * @param {boolean} [isLineItems] defines whether to add additional fields to be used for L2 L3 data
 * @returns {Array} array with all items in the basket
 */
function getItemsForPurchaseUnit(allProductLineItems, currencyCode, isLineItems) {
    const Resource = require('dw/web/Resource');

    return allProductLineItems.toArray().reduce(function(accum, lineItem) {
        const isProduct = !empty(lineItem.product);

        const item = {
            name: lineItem.productName,
            quantity: lineItem.quantityValue,
            sku: lineItem.productID,
            url: isProduct ? lineItem.product.pageURL : null,
            unit_amount: {
                currency_code: currencyCode,
                value: lineItem.basePrice.value
            }
        };

        if (isProduct) {
            const upc = {
                type: 'UPC-A',
                code: lineItem.product.UPC
            };

            if (upc.code !== '' && upc.code !== null) {
                item.upc = upc;
            }
        } else if (lineItem.parent) {
            item.description = Resource.msgf('purchaseunit.item.option.description', 'notifications', null, lineItem.parent.productName);
        }

        if (isLineItems === true) {
            item.total_amount = {
                currency_code: currencyCode,
                value: lineItem.price.value
            };

            const moneyInstance = lineItem.price.subtract(lineItem.proratedPrice);
            const discountAmountValue = moneyInstance.available ? moneyInstance.decimalValue.toString() : '0';

            item.discount_amount = {
                currency_code: currencyCode,
                value: discountAmountValue
            };

            item.tax = {
                currency_code: currencyCode,
                value: lineItem.adjustedTax.value
            };
        }

        accum.push(item);

        return accum;
    }, []);
}

/**
 * Creates purchase unit data
 * PayPal amount should equal: item_total + tax_total + shipping + handling + insurance - shipping_discount - discount
 *
 * @param {dw.order.Basket} currentBasket - user's basket
 * @param {boolean} [isExpressCheckout] - indicates if it is EC flow
 * @param {Object} [paymentSource] - payment source data
 * @returns {Object} with purchase unit data
 */
function getPurchaseUnit(currentBasket, isExpressCheckout, paymentSource) {
    const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

    const {
        currencyCode,
        productLineItems,
        allProductLineItems,
        shippingTotalPrice,
        adjustedShippingTotalPrice,
        merchandizeTotalPrice,
        adjustedMerchandizeTotalPrice,
        giftCertificateLineItems,
        giftCertificateTotalPrice,
        totalTax
    } = currentBasket;

    let orderNo;
    let handling;
    let insurance;
    let isLineItems = false;

    Transaction.wrap(function() {
        orderNo = currentBasket instanceof Order
            ? currentBasket.orderNo
            : OrderMgr.createOrderNo();
    });

    const nonShippingDiscount = Array.reduce(currentBasket.giftCertificatePaymentInstruments,
        getAppliedGiftCertificateTotal,
        merchandizeTotalPrice.subtract(adjustedMerchandizeTotalPrice));

    const itemsDescription = [getItemsDescription(productLineItems),
        getGiftCertificateDescription(giftCertificateLineItems)].join(' ');

    const items = getItemsForPurchaseUnit(allProductLineItems, currencyCode);

    const taxTotal = TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS ? '0' : totalTax.value.toString();

    const purchaseUnit = {
        description: itemsDescription.trim(),
        invoice_id: orderNo,
        amount: {
            currency_code: currencyCode,
            value: paymentInstrumentHelper.calculateNonGiftCertificateAmount(currentBasket).toNumberString(),
            breakdown: {
                item_total: {
                    currency_code: currencyCode,
                    value: merchandizeTotalPrice.add(giftCertificateTotalPrice).value.toString()
                },
                shipping: {
                    currency_code: currencyCode,
                    value: shippingTotalPrice.value.toString()
                },
                tax_total: {
                    currency_code: currencyCode,
                    value: taxTotal
                },
                handling: {
                    currency_code: currencyCode,
                    value: !empty(handling) ? handling : '0'
                },
                insurance: {
                    currency_code: currencyCode,
                    value: !empty(insurance) ? insurance : '0'
                },
                shipping_discount: {
                    currency_code: currencyCode,
                    value: shippingTotalPrice
                        .subtract(adjustedShippingTotalPrice)
                        .value.toString()
                },
                discount: {
                    currency_code: currencyCode,
                    value: nonShippingDiscount.value.toString()
                }
            }
        },
        soft_descriptor: constants.SOFT_DESCRIPTOR,
        items: items
    };

    const updatedPurchaseUnit = getShippingDetails(currentBasket, isExpressCheckout, purchaseUnit);

    if (paymentSource && (paymentSource.paypal || paymentSource.venmo)) {
        const paymentSourcePaypalHelper = require('*/cartridge/scripts/paypal/helpers/paymentSourcePaypal');

        paymentSourcePaypalHelper.addContactInfoToPurchaseUnit({
            currentBasket: currentBasket,
            purchaseUnit: purchaseUnit,
            isDigitalGoodsFlowEnabled: paypalPreferences.isDigitalGoodsFlowEnabled,
            isExpressCheckout: isExpressCheckout
        });
    }

    if (paypalPreferences.l2l3DataEnabled) {
        isLineItems = true;

        const lineItems = getItemsForPurchaseUnit(allProductLineItems, currencyCode, isLineItems);

        updatedPurchaseUnit.supplementary_data = {
            card: {
                level_2: {
                    invoice_id: orderNo,
                    tax_total: {
                        currency_code: currencyCode,
                        value: taxTotal
                    }
                },
                level_3: {
                    shipping_amount: {
                        currency_code: currencyCode,
                        value: shippingTotalPrice.value.toString()
                    },
                    discount_amount: {
                        currency_code: currencyCode,
                        value: nonShippingDiscount.value.toString()
                    },
                    shipping_address: updatedPurchaseUnit.shipping ? updatedPurchaseUnit.shipping.address : null,
                    line_items: lineItems
                }
            }
        };
    }

    return updatedPurchaseUnit;
}

/**
 * Returns transaction end time, result
 * (min) transaction lifetime (by default 72h or 4320min)
 * @param {dw.order.PaymentInstrument} paymentInstrument - PayPal payment instrument from basket
 * @returns {boolean} expired status
 */
function isExpiredTransaction(paymentInstrument) {
    if (!paymentInstrument) {
        return false;
    }

    const min = 4320;

    return Date.now() >= new Date(Date.parse(paymentInstrument.creationDate) + min * 60000).getTime();
}

/**
 * Returns value whether Fastlane is used or not
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument
 * @return {boolean} true/false
 */
function isFastlaneUsed(paymentInstrument) {
    return !customer.authenticated && paypalPreferences.isFastlaneEnabled
        && paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
}

/**
 * Returns whether the purchase unit was changed.
 *
 * @param {Object} purchaseUnit - The purchase unit.
 * @param {dw.order.PaymentInstrument} paymentInstrument - The PayPal payment instrument from basket.
 * @param {string} orderDataHash The order data hash represents the encoded purchase unit of the PayPal order
 * @returns {boolean} - Identifies wether the purchase unit was changed (true or false).
 */
function isPurchaseUnitChanged(purchaseUnit, paymentInstrument, orderDataHash) {
    const paypalApi = require('*/cartridge/scripts/paypal/api');

    // Is not applicable for Credit Card payment method
    if (paymentInstrument.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD) {
        return false;
    }

    const { purchase_units } = paypalApi.getOrderDetails(paymentInstrument);

    // purchase unit was changed in case it's differs on the PayPal side
    if (!purchase_units || purchaseUnit.amount.value !== purchase_units[0].amount.value) {
        return true;
    }

    // purchase unit was changed in case it's hash in session was removed
    if (!orderDataHash) {
        return true;
    }

    // purchase unit was changed in case it's hash in session was changed
    return orderDataHash !== paypalUtils.encodeString(purchaseUnit);
}

/**
 * Returns whether basket has giftCertificates
 * @param {dw.order.Basket} currentBasket - user's basket
 * @returns {boolean} true or false
 */
function hasGiftCertificates(currentBasket) {
    return currentBasket.giftCertificateLineItems.length > 0;
}

/**
 * Returns whether basket has only giftCertificates
 * @param {dw.order.Basket} currentBasket - user's basket
 * @returns {boolean} true or false
 */
function hasOnlyGiftCertificates(currentBasket) {
    return currentBasket && currentBasket.giftCertificateLineItems.length > 0 && currentBasket.productLineItems.length === 0;
}

/**
 * The hack renders right mock data for updatePaymentInformation(order)
 * @param {Object} basketModel - order data
 * @param {string} currencyCode - currencyCode
 * @param {Object} ppPaymentInstrumentCustomProps - custom properties of paypal payment instrument
 */
function basketModelHack(basketModel, currencyCode, ppPaymentInstrumentCustomProps) {
    const {
        resources,
        billing
    } = basketModel;

    const paypalAmount = billing.payment.selectedPaymentInstruments[0].amount;

    resources.cardType = '';
    resources.cardEnding = '';

    billing.payment.selectedPaymentInstruments.forEach(function(pi) {
        if (pi.paymentMethod === constants.PAYMENT_METHOD_ID_PAYPAL) {
            pi.type = '';
            pi.maskedCreditCardNumber = basketModel.paypalPayerEmail || '';
            pi.expirationMonth = ppPaymentInstrumentCustomProps.paymentId === constants.PAYMENT_METHOD_ID_VENMO
                ? constants.PAYMENT_METHOD_ID_VENMO + ' ' : constants.PAYMENT_METHOD_ID_PAYPAL + ' ';
            pi.expirationYear = ' ' + StringUtils.formatMoney(new Money(paypalAmount, currencyCode));
        }
    });
}

/**
 * Updates PayPal email
 *
 * @param {Object} params data object with basketModel and paypalPaymentInstrument
 */
function updatePayPalEmail(params) {
    if (session.privacy.paypalPayerEmail) {
        params.basketModel.paypalPayerEmail = session.privacy.paypalPayerEmail;
        if (params.paypalPI && params.paypalPI.custom.currentPaypalEmail !== session.privacy.paypalPayerEmail) {
            Transaction.wrap(function() {
                params.paypalPI.custom.currentPaypalEmail = session.privacy.paypalPayerEmail;
            });
        }
    } else {
        params.basketModel.paypalPayerEmail = params.paypalPI.custom.currentPaypalEmail || '';
    }

    session.privacy.paypalPayerEmail = null;
}

/**
 * Get Billing Form Fields
 * @param {dw.order.PaymentInstrument} paypalPaymentInstrument active paypal payment instrument, if exist
 * @return {Object} of form fields
 */
function getPreparedBillingFormFields(paypalPaymentInstrument) {
    const billingForm = server.forms.getForm('billing');
    const paypalEmail = paypalPaymentInstrument && paypalPaymentInstrument.custom.currentPaypalEmail;
    const usedPaymentMethod = billingForm.paypal.usedPaymentMethod.htmlValue;
    const data = {};

    billingForm.clear();

    data.paypalActiveAccount = paypalEmail;
    data.usedPaymentMethod = usedPaymentMethod;

    const ppFields = {
        paymentMethod: {
            name: billingForm.paymentMethod.htmlName,
            value: constants.PAYMENT_METHOD_ID_PAYPAL
        }
    };

    Object.keys(data).forEach(function(key) {
        if (Object.prototype.hasOwnProperty.call(billingForm.paypal, key)) {
            ppFields[key] = {
                name: billingForm.paypal[key].htmlName,
                value: !empty(data[key]) ? data[key] : ''
            };
        }
    });

    return ppFields;
}

/**
 * Returns the Apple pay form fields object
 * @returns {Object} The Apple pay form fields object
 */
function getApplePayFormFields() {
    const billingForm = server.forms.getForm('billing');

    billingForm.clear();

    const fields = [
        'applePayEmailAddress',
        'applePayPaymentSource',
        'applePayPhoneNumber',
        'applePayShippingAddressAsString'
    ];

    const fieldsData = {
        usedPaymentMethod: {
            name: billingForm.paypal.usedPaymentMethod.htmlName
        },
        paymentMethod: {
            name: billingForm.paymentMethod.htmlName
        }
    };

    return fields.reduce(function(accum, curr) {
        accum[curr] = {
            name: billingForm.paypal.applePay[curr].htmlName
        };

        return accum;
    }, fieldsData);
}

/**
 * Create URL for a call
 * @param  {dw.svc.ServiceCredential} credential current service credential
 * @param  {string} path REST action endpoint
 * @returns {string} url for a call
 */
function getUrlPath(credential, path) {
    let url = credential.URL;

    if (!url.match(/.+\/$/)) {
        url += '/';
    }

    url += path;

    return url;
}

/**
 * Encoding the passed credentials to Base64 string
 * @param {dw.svc.ServiceCredential} credentials Service credentials
 * @returns {string} Base64 string
 */
function getAccessToken(credentials) {
    const authCredentials = [credentials.user, credentials.password].join(':');

    return Encoding.toBase64(new Bytes(authCredentials));
}

/**
 * Return an order
 * @param {string} orderNo Order number
 * @returns {dw.order.Order|null} Order instance
 */
function getOrderByOrderNo(orderNo) {
    return OrderMgr.searchOrder('orderNo = {0}', orderNo);
}

/**
 * Get transaction id from transaction response
 * @param  {Object} transactionResponse Response from call
 * @returns {string} Transaction id from response
 */
function getTransactionId(transactionResponse) {
    const payments = transactionResponse.purchase_units[0].payments;

    return payments.captures
        ? payments.captures[0].id
        : payments.authorizations[0].id;
}

/**
 * Get transaction status from transaction response
 * @param  {Object} transactionResponse Response from call
 * @returns {string} Transaction status from response
 */
function getTransactionStatus(transactionResponse) {
    const payments = transactionResponse.purchase_units[0].payments;

    let transactionStatus = payments.captures ? payments.captures[0].status : payments.authorizations[0].status;

    if (payments.authorizations && payments.authorizations[0].status === 'CAPTURED' && !payments.refunds) {
        transactionStatus = payments.authorizations[0].status;
    }

    return transactionStatus;
}

/**
 * Get transaction details for paypalTransactionHistory
 * @param {Object} transactionResponse - Response from call
 * @returns {Object} - Transaction history details
 */
function getTransactionHistory(transactionResponse) {
    let amount;
    let status;
    let datetime;

    if (transactionResponse.purchase_units) {
        const payments = transactionResponse.purchase_units[0].payments;

        status = getTransactionStatus(transactionResponse);
        amount = payments.captures ? payments.captures[0].amount.value : payments.authorizations[0].amount.value;
        datetime = payments.captures ? payments.captures[0].create_time : payments.authorizations[0].create_time;
    } else {
        status = transactionResponse.paymentStatus || transactionResponse.status;
        amount = transactionResponse.amount.value;
        datetime = transactionResponse.create_time;
    }

    return {
        amount: amount,
        status: status,
        timestamp: datetime
    };
}

/**
 * @param {dw.object.CustomObject|dw.order.PaymentTransaction} objectType - a system or custom object type
 * @param {Object} responseData - a response data
 * @returns {string} - a transaction history result
 */
function prepareTransactionHistory(objectType, responseData) {
    const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');
    const paypalTransactionHistory = objectType.custom.paypalTransactionHistory;

    let transactionHistory = [];

    if (basicHelpers.isJson(paypalTransactionHistory)) {
        transactionHistory = JSON.parse(paypalTransactionHistory);
    }

    transactionHistory.push(getTransactionHistory(responseData));

    return JSON.stringify(transactionHistory);
}

/**
 * Clears paymentId property in case of NOT Venmo account or set paymentId property in case of change to Venmo account
 * @param {Object} paypalPaymentInstrument Active PayPal payment instrument, if exists
 * @param {Object} billingForm A billing form
 * @returns {void}
 */
function updatePaymentId(paypalPaymentInstrument, billingForm) {
    const venmoName = constants.PAYMENT_METHOD_ID_VENMO;

    if (paypalPaymentInstrument.custom.paymentId === venmoName
        && billingForm.paypal.usedPaymentMethod.htmlValue !== venmoName) {
        paypalPaymentInstrument.custom.paymentId = null;
    } else if (billingForm.paypal.usedPaymentMethod.htmlValue === venmoName
        && paypalPaymentInstrument.custom.paymentId !== venmoName) {
        paypalPaymentInstrument.custom.paymentId = venmoName;
    }
}

/**
 * Updates response viewData for FraudNet Integration
 * @param {Object} response data response object from controller
 * @returns {void}
 */
function updateViewDataForFraudNet(response) {
    const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');
    const sdkConfig = require('*/cartridge/config/sdkConfig');
    const paypalSDK = require('*/cartridge/config/sdk');

    if (paypalPreferences.isFraudNetEnabled) {
        const fraudNetUID = basicHelpers.getPpClientMetadataId();

        response.viewData.paypal.fraudNet = {
            fraudNetUID: fraudNetUID,
            paypalFraudNetScriptLink: sdkConfig.paypalFraudNetScriptLink,
            fraudNetNoScriptURL: paypalSDK.fraudNetNoScriptURL(fraudNetUID)
        };
    }
}

/**
 * Updates View data object for digital goods integration
 * @param {Object} [response] data response object from controller
 * @param {string} [currency] Basket currency
 * @returns {void}
 */
function updateViewDataForDigitalGoods(response, currency) {
    if (!paypalPreferences.isDigitalGoodsFlowEnabled) {
        return;
    }

    const shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    response.viewData.paypal.digitalGoodsData = {
        currentBasketShipmentUUID: response.viewData.order.shipping[0].UUID,
        onlinePickupMethodID: shippingHelpers.getOnlinePickupShippingMethod(currency).ID
    };
}

/**
 * The function takes a billingAddress object and returns a JSON string representation of it.
 * @param {dw.order.OrderAddress|Object} billingAddress - an object that contains the billing address data.
 * @returns {string} - a JSON string representation of the billingAddress object.
 */
function stringifyBillingAddress(billingAddress) {
    return JSON.stringify({
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        address1: billingAddress.address1,
        address2: billingAddress.address2 || '',
        city: billingAddress.city,
        stateCode: billingAddress.stateCode,
        postalCode: decodeURIComponent(billingAddress.postalCode),
        countryCode: { value: billingAddress.countryCode.value },
        phone: billingAddress.phone
    });
}

/**
 * Splits a full name into a separate first as well as a second name
 * We assume that first name is first part of full name and the rest is last name
 * @param {string} fullName A full name
 * @returns {Object} An object with first and last name
 */
function splitFullName(fullName) {
    const fullNameArray = fullName.split(/\s+/);

    return {
        firstName: fullNameArray.shift(),
        lastName: fullNameArray.join(' ')
    };
}

/**
 * Creates credit message SDK url
 * Needed in case when we need only credit message url, without other PP parameters
 * @returns {string} credit message sdk url
 */
function createCreditMessageSdkUrl() {
    const clientID = paypalUtils.getClientId();

    return ['https://www.paypal.com/sdk/js?client-id=', clientID, '&components=messages'].join('');
}

/**
 * Updates response viewData for Pay Later Cross Border Messaging
 * @param {Object} res data response object from controller
 * @param {Object} req data request object from controller
 * @returns {void}
 */
function updateViewDataForPayLaterCrossBorderMessaging(res, req) {
    if (paypalPreferences.ppPayLaterCrossBorderMessagingEnabled) {
        res.viewData.paylaterMessaging.locale = require('dw/util/Locale').getLocale(req.locale.id).country;
        res.viewData.paylaterMessaging.currencyCode = req.session.currency.currencyCode;
    }
}

/**
 * Calculates total price of the product
 * @param {Object} product - product object
 * @returns {string} total price of the product
 */
function getProductTotalPrice(product) {
    const price = product.price;
    const selectedQuantity = product.selectedQuantity;

    let sales = price.sales;

    if (price.type === 'range') {
        sales = price.max.sales;
    } else if (price.type === 'tiered') {
        const tierData = price.tiers.find(function(tier) {
            return tier.quantity === selectedQuantity;
        });

        sales = tierData ? tierData.price.sales : price.startingFromPrice.sales;
    }

    if (sales.value === null) {
        return '0.00';
    }

    let newMoney = new Money(sales.value, sales.currency);

    newMoney = newMoney.multiply(selectedQuantity);

    return newMoney.decimalValue.toString();
}

/**
 * Returns product prices
 * @param {Object} product - the product object
 * @returns {Object} - an object containing the product prices
 */
function getProductPrices(product) {
    const productPrices = {
        product: { amount: getProductTotalPrice(product) }
    };

    if (product.productType === 'set') {
        product.individualProducts.forEach(function(individualProduct) {
            productPrices[individualProduct.id] = { amount: getProductTotalPrice(individualProduct) };
        });
    }

    return productPrices;
}

/**
 * Returns key/value entries for an object with a safe fallback for runtimes
 * that do not implement Object.entries.
 * @param {Object} obj - object to convert into entries
 * @returns {Array} array of [key, value] pairs
 */
function getObjectEntries(obj) {
    if (typeof Object.entries === 'function') {
        return Object.entries(obj);
    }

    return Object.keys(obj).map(function(key) {
        return [key, obj[key]];
    });
}

/**
 * Assigns product amounts with configuration object
 * @param {Object} productPrices The product prices object
 * @param {Object} configObj The configuration object
 * @returns {Object} The updated product prices object
 */
function assignProductAmountWithConfiguration(productPrices, configObj) {
    getObjectEntries(productPrices).forEach(function(entry) {
        const key = entry[0];
        const value = entry[1];

        productPrices[key] = Object.assign({}, configObj, value);
    });

    return productPrices;
}

/**
 * Returns button message configuration based on page type
 * @param {string} pageType - page type (e.g. PDP, PVP, Cart, Checkout)
 * @param {Object} res - data response object from controller
 * @return {string} JSON string of button message configuration
 */
function getButtonMessageConfig(pageType, res) {
    let config = paypalPreferences.buttonMessageConfig[pageType];

    const currentBasket = BasketMgr.getCurrentBasket();

    config.amount = currentBasket ? currentBasket.totalGrossPrice.value : 0;

    if ([constants.PAGE_FLOW_PDP, constants.PAGE_FLOW_PVP].includes(pageType)) {
        config = assignProductAmountWithConfiguration(getProductPrices(res.viewData.product), config);
    }

    return JSON.stringify(config);
}

/**
 * Updates response viewData for PayPal Pay Later Messaging on Checkout/Cart pages
 * @param {Object} res data response object from controller
 * @param {string} flow Checkout/Cart preview pages
 * @returns {void}
 */
function updateViewDataForPayLaterMessaging(res, flow) {
    const messagingConfig = require('*/cartridge/config/payLaterMessagingConfig');

    const isPayPalEnabled = paymentHelper.isElementEnabled(flow, constants.PAYPAL_BUTTON_LOCATION);
    const isVenmoEnabled = paymentHelper.isElementEnabled(flow, constants.VENMO_BUTTON_LOCATION);

    res.viewData.paylaterMessagingAvailable = true;

    res.viewData.paylaterMessaging = {
        config: Object.assign({}, messagingConfig[flow], { amount: BasketMgr.currentOrNewBasket.totalGrossPrice.value })
    };

    if (!isPayPalEnabled && !isVenmoEnabled) {
        res.viewData.bannerSdkUrl = createCreditMessageSdkUrl();
    }
}

/**
 * Updates response viewData for PayPal Pay Later Messaging on product pages (pdp, pvp)
 * @param {Object} res data response object from controller
 * @param {string} flow Product/Product preview
 * @returns {void}
 */
function updateProductViewDataForPayLaterMessaging(res, flow) {
    const payLaterMessagingConfig = require('*/cartridge/config/payLaterMessagingConfig');
    const buttonFlow = flow === constants.PAGE_FLOW_PRODUCT ? constants.PAGE_FLOW_PDP : constants.PAGE_FLOW_PVP;

    const isPayPalButtonEnabled = paymentHelper.isElementEnabled(buttonFlow, constants.PAYPAL_BUTTON_LOCATION);
    const isVenmoButtonEnabled = paymentHelper.isElementEnabled(buttonFlow, constants.VENMO_BUTTON_LOCATION);

    const messagingConfig = flow === constants.PAGE_FLOW_PRODUCT
        ? payLaterMessagingConfig.product : payLaterMessagingConfig.product_preview;

    res.viewData.paylaterMessagingAvailable = true;
    res.viewData.paylaterMessaging = {
        config: assignProductAmountWithConfiguration(getProductPrices(res.viewData.product), messagingConfig)
    };

    if (!isPayPalButtonEnabled && !isVenmoButtonEnabled) {
        res.viewData.bannerSdkUrl = createCreditMessageSdkUrl();
    }
}

/**
 * Get value for custom attribute (PayPal email)
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument
 * @returns {string|null} - paypal email address
 */
function getCustomAttributePaypalEmail(paymentInstrument) {
    if (!paymentInstrument) {
        return null;
    }

    const emailKeys = ['currentPaypalEmail', 'paypalVaultEmail'];

    const attribute = emailKeys.find(function(key) {
        return Object.prototype.hasOwnProperty.call(paymentInstrument.custom, key);
    });

    return attribute ? paymentInstrument.custom[attribute] : null;

}

/**
 * Checks if given account already exists
 * @param {string} email PayPal account email
 * @returns {boolean} whether the account is a duplicate
 */
function isDuplicatedPpAccount(email) {
    const customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL);

    return customerSavedPaypalAccounts.some(function(account) {
        return getCustomAttributePaypalEmail(account) === email;
    });
}

/**
 * Saves PayPal account to the customer's wallet
 * @param {Object} responseData response from PayPal
 * @returns {Object} result and error msg
 */
function savePaypalToCustomerWallet(responseData) {
    const Resource = require('dw/web/Resource');

    const profile = customer.profile;

    if (!profile) {
        return profile;
    }

    const paypalApi = require('*/cartridge/scripts/paypal/api');

    const paypalData = responseData.payment_source.paypal;
    const attributes = paypalData.attributes;
    const email = paypalData.email_address;
    const address = paypalData.address;
    const name = paypalData.name;
    const phoneNumber = paypalData.phone ? paypalData.phone.phone_number : null;

    let vaultId;
    let customerId;

    const isMyAccountFlow = paypalData && !attributes;

    if (isMyAccountFlow) {
        vaultId = responseData.id;
        customerId = responseData.customer.id;

        const isDuplicate = isDuplicatedPpAccount(email);

        if (isDuplicate) {
            const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

            const duplicateAccountMessage = Resource.msg('paypal.account.list.already.saved', 'locale', null);

            if (!paymentInstrumentHelper.getCustomerPiByCreditCardToken(vaultId, profile)) {
                paypalApi.deletePaymentToken(vaultId);
            }

            return {
                error: true,
                msg: duplicateAccountMessage
            };
        }
    } else {
        vaultId = attributes.vault.id;
        customerId = attributes.vault.customer.id;
    }

    Transaction.wrap(function() {
        if (!profile.custom.payPalCustomerId) {
            profile.custom.payPalCustomerId = customerId;
        }

        const customerPaymentInstrument = profile.wallet.createPaymentInstrument(constants.PAYMENT_METHOD_ID_PAYPAL);

        customerPaymentInstrument.setCreditCardType(constants.CREDIT_CARD_TYPE_VISA); // hack for SFRA account.js line 99 (paymentInstrument.creditCardType.toLowerCase())
        customerPaymentInstrument.custom.currentPaypalEmail = email;
        customerPaymentInstrument.custom.paypalBillingAddress = JSON.stringify(
            Object.assign(address, name, phoneNumber)
        );
        customerPaymentInstrument.creditCardToken = vaultId;

        customerHelper.setPayPalSavedCardsPaymentToken(profile.custom, vaultId);
    });

    return {
        error: false
    };
}

/**
 * Sets the billing address from Paypal to the basket
 * Basically is used on the Billing page in scope of the hook execution
 * @param {dw.order.Basket} basket The current basket
 * @param {Object} paypalBillingAddress The billing address from the Paypal payment
 */
function setBillingAddressFromPaypal(basket, paypalBillingAddress) {
    Transaction.wrap(function() {
        if (!basket.billingAddress) {
            basket.createBillingAddress();
        }

        basket.billingAddress.address1 = paypalBillingAddress.address_line_1;
        basket.billingAddress.city = paypalBillingAddress.admin_area_2;
        basket.billingAddress.countryCode = paypalBillingAddress.country_code;
        basket.billingAddress.firstName = paypalBillingAddress.given_name;
        basket.billingAddress.lastName = paypalBillingAddress.surname;
        basket.billingAddress.postalCode = paypalBillingAddress.postal_code;
        basket.billingAddress.stateCode = paypalBillingAddress.admin_area_1;

        if (paypalBillingAddress.national_number) {
            basket.billingAddress.phone = paypalBillingAddress.national_number;
        }
    });
}

/**
 * Completes a saved PayPal order
 * @param {Object} purchaseUnit A purchase unit object
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} An object
 */
function completeSavedPaypalOrder(purchaseUnit, order, paymentInstrument) {
    const paypalApi = require('*/cartridge/scripts/paypal/api');
    const paypalProcessorHelper = require('*/cartridge/scripts/paypal/helpers/paypalProcessorHelper');

    const paypalOrder = paypalApi.createOrder({
        purchaseUnit: purchaseUnit,
        lineItemCtnr: order
    }, {
        paypal: {
            vault_id: paymentInstrument.creditCardToken
        }
    });

    let result = {
        authorized: true
    };

    if (paypalOrder.err) {
        paypalUtils.createErrorLog(paypalOrder.err);

        result = {
            error: true,
            authorized: false,
            fieldErrors: [],
            serverErrors: [paypalOrder.err],
            message: paypalOrder.err
        };
    } else {
        const response = paypalOrder.resp;

        paypalProcessorHelper.saveGeneralTransactionData(paymentInstrument, response, paypalOrder.requestBody);

        Transaction.wrap(function() {
            paymentInstrument.custom.paypalOrderID = response.id;
            order.custom.PP_API_TransactionID = paymentInstrument.paymentTransaction.transactionID;
            order.custom.paypalPaymentMethod = constants.PAYPAL_ORDER_INDICATOR;
        });

        setBillingAddressFromPaypal(order, JSON.parse(paymentInstrument.custom.paypalBillingAddress));
    }

    return result;
}

/**
 * Converts billing agreement and based on conversion result creates a payment instrument
 * @param {Array} billingAgreements - an array of customer's billing agreements
 * @param {dw.customer.Profile} profile - customer's profile
 * @returns {void}
 */
function convertBillingAgreements(billingAgreements, profile) {
    const paypalApi = require('*/cartridge/scripts/paypal/api');

    const successfullyConvertedBAs = [];

    billingAgreements.forEach(function(billingAgreement) {
        const convertedVaultTokenResponse = paypalApi.createPaymentToken(
            billingAgreement.baID,
            constants.BA_TOKEN_TYPE,
            profile.custom.payPalCustomerId
        );

        if (!convertedVaultTokenResponse.err) {
            successfullyConvertedBAs.push(billingAgreement.baID);

            const paymentSource = convertedVaultTokenResponse.payment_source.paypal;

            Transaction.wrap(function() {
                if (!profile.custom.payPalCustomerId) {
                    profile.custom.payPalCustomerId = convertedVaultTokenResponse.customer.id;
                }

                const customerPaymentInstrument = profile.wallet.createPaymentInstrument(constants.PAYMENT_METHOD_ID_PAYPAL);

                // hack for SFRA account.js line 99 (paymentInstrument.creditCardType.toLowerCase())
                customerPaymentInstrument.setCreditCardType(constants.CREDIT_CARD_TYPE_VISA);
                customerPaymentInstrument.custom.currentPaypalEmail = paymentSource.email_address;
                customerPaymentInstrument.custom.paypalBillingAddress = JSON.stringify(Object.assign(
                    paymentSource.address,
                    paymentSource.name,
                    paymentSource.phone ? paymentSource.phone.phone_number : null
                ));
                customerPaymentInstrument.creditCardToken = convertedVaultTokenResponse.id;
            });
        }
    });

    const notConvertedBAs = billingAgreements
        .filter(function(ba) {
            return !successfullyConvertedBAs.includes(ba.baID);
        })
        .map(function(ba) {
            return { baID: ba.baID };
        });

    // Rewrite the custom attribute with billing agreements that were not converted if one exist
    Transaction.wrap(function() {
        profile.custom.PP_API_billingAgreement = !empty(notConvertedBAs) ? JSON.stringify(notConvertedBAs) : null;
    });
}

/**
 * Get payer or convert and return received payment source to payer object
 * @param {Object} paymentSource received payment source
 * @return {Object} PayPal payer object
 */
function getBillingAddressFromPaymentSource(paymentSource) {
    if (paymentSource.payer) {
        return paymentSource.payer;
    }

    const paymentId = Object.keys(paymentSource.payment_source)[0];

    paymentSource = paymentSource.payment_source[paymentId];

    return {
        email_address: paymentSource.email_address,
        name: paymentSource.name,
        address: paymentSource.card.billing_address || paymentSource.address,
        phone: {
            phone_number: paymentSource.phone_number
        }
    };
}

/**
 * Return value is PayPal or Apple Pay or GooglePay enabled
 * @return {boolean} is PayPal or Apple Pay or GooglePay enabled
 */
function isAtLeastOnePaymentMethodEnabled() {
    return paypalPreferences.isPayPalPmActive
        || paypalPreferences.isApplePayPmActive
        || paypalPreferences.isGooglePayActive
        || paypalPreferences.isVenmoEnabled;
}

/**
 * Handle required actions in case of expired transaction
 * @param {Object} res - response
 * @param {dw.order.Basket} currentBasket - Current users's basket
 */
function handleExpiredTransaction(res, currentBasket) {
    const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

    paypalUtils.createErrorLog(paypalUtils.createErrorMsg('expiredpayment'));

    paymentInstrumentHelper.removePaypalPaymentInstrument(currentBasket);

    res.json({
        error: true,
        cartError: true,
        redirectUrl: require('*/cartridge/config/urls').paymentStage,
        fieldErrors: res.viewData.fieldErrors,
        serverErrors: []
    });
}

/**
 * Returns the customer's email, or an empty string if not available.
 * Useful when embedding into HTML attributes to avoid `null` or `undefined`.
 * @returns {string} Customer email or an empty string.
 */
function getCustomerEmailOrEmpty() {
    let customerEmail = '';

    if (customer.authenticated && customer.registered) {
        const profile = customer.profile;
        const paymentInstruments = profile.wallet.getPaymentInstruments(constants.PAYMENT_METHOD_ID_PAYPAL).toArray();
        const sortedPaymentInstruments = paymentHelper.sortPaymentInstrumentsByLastModifiedDesc(paymentInstruments);
        const paypalEmail = getCustomAttributePaypalEmail(sortedPaymentInstruments[0]);

        if (paypalEmail) {
            return paypalEmail;
        }

        customerEmail = profile.email;
    }

    const basket = BasketMgr.currentBasket;

    if (basket) {
        return basket.customerEmail || customerEmail;
    }

    return customerEmail;
}

/**
 * Process Pay later messaging in scope of viewData creating process
 * @param {Object} req data request object from controller
 * @param {Object} res data response object from controller
 * @param {string} flow Pay later messaging page flow
 * @returns {void}
 */
function processPaylaterMessagingConfiguration(req, res, flow) {
    const messagingConfig = require('*/cartridge/config/payLaterMessagingConfig');

    const payLaterMessageAvailable = paypalPreferences.isPayPalPmActive && messagingConfig[flow].status === constants.STATUS_ENABLED;

    if (!payLaterMessageAvailable) {
        return;
    }

    if ([constants.PAGE_FLOW_CHECKOUT, constants.PAGE_FLOW_CART].includes(flow)) {
        updateViewDataForPayLaterMessaging(res, flow);
    } else {
        updateProductViewDataForPayLaterMessaging(res, flow);
    }

    updateViewDataForPayLaterCrossBorderMessaging(res, req);
}

module.exports = {
    isExpiredTransaction: isExpiredTransaction,
    isPurchaseUnitChanged: isPurchaseUnitChanged,
    hasGiftCertificates: hasGiftCertificates,
    hasOnlyGiftCertificates: hasOnlyGiftCertificates,
    getPurchaseUnit: getPurchaseUnit,
    basketModelHack: basketModelHack,
    updatePayPalEmail: updatePayPalEmail,
    getPreparedBillingFormFields: getPreparedBillingFormFields,
    getUrlPath: getUrlPath,
    getAccessToken: getAccessToken,
    getOrderByOrderNo: getOrderByOrderNo,
    getTransactionId: getTransactionId,
    getTransactionStatus: getTransactionStatus,
    prepareTransactionHistory: prepareTransactionHistory,
    updatePaymentId: updatePaymentId,
    updateViewDataForFraudNet: updateViewDataForFraudNet,
    stringifyBillingAddress: stringifyBillingAddress,
    splitFullName: splitFullName,
    getApplePayFormFields: getApplePayFormFields,
    createCreditMessageSdkUrl: createCreditMessageSdkUrl,
    updateViewDataForPayLaterCrossBorderMessaging: updateViewDataForPayLaterCrossBorderMessaging,
    updateViewDataForPayLaterMessaging: updateViewDataForPayLaterMessaging,
    updateProductViewDataForPayLaterMessaging: updateProductViewDataForPayLaterMessaging,
    savePaypalToCustomerWallet: savePaypalToCustomerWallet,
    completeSavedPaypalOrder: completeSavedPaypalOrder,
    setBillingAddressFromPaypal: setBillingAddressFromPaypal,
    getCustomAttributePaypalEmail: getCustomAttributePaypalEmail,
    convertBillingAgreements: convertBillingAgreements,
    isDuplicatedPpAccount: isDuplicatedPpAccount,
    isReturningCustomerExperienceEnabled: isReturningCustomerExperienceEnabled,
    getBillingAddressFromPaymentSource: getBillingAddressFromPaymentSource,
    isAtLeastOnePaymentMethodEnabled: isAtLeastOnePaymentMethodEnabled,
    isFastlaneUsed: isFastlaneUsed,
    handleExpiredTransaction: handleExpiredTransaction,
    getCustomerEmailOrEmpty: getCustomerEmailOrEmpty,
    processPaylaterMessagingConfiguration: processPaylaterMessagingConfiguration,
    updateViewDataForDigitalGoods: updateViewDataForDigitalGoods,
    getButtonMessageConfig: getButtonMessageConfig
};
