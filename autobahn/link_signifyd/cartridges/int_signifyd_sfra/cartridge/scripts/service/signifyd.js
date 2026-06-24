/**
* Main Signifyd Script File
* Two main public methods are Call and Callback
*
* Call - for export order info to.
* Callback - for receive data about guarantie Status.
*
*/
var Site = require('dw/system/Site');
var System = require('dw/system/System');
var sitePrefs = Site.getCurrent().getPreferences();
var APIkey = sitePrefs.getCustom().SignifydApiKey;
var HoldBySignified = sitePrefs.getCustom().SignifydHoldOrderEnable;
var EnableCartridge = sitePrefs.getCustom().SignifydEnableCartridge;
var Mac = require('dw/crypto/Mac');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Encoding = require('dw/crypto/Encoding');
var URLUtils = require('dw/web/URLUtils');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var signifydInit = require('int_signifyd_sfra/cartridge/scripts/service/signifydInit');
var Order = require('dw/order/Order');

/**
 * Get information about the SFCC version
 * @return {result} - json describing the version
 */
function getPlatform() {
    return {
        storePlatform: 'Salesforce Commerce Cloud',
        storePlatformVersion: String(System.getCompatibilityMode()), // returns a string with the platform version: 1602
        signifydClientApp: 'Salesforce Commerce Cloud',
        signifydClientAppVersion: '19.2' // current year + number of certifications in the year
    };
}

// eslint-disable-next-line valid-jsdoc
/**
 * Get Information about customer in JSON format
 * acceptable on Stringifyd side
 *
 * @param {order}  order that just have been placed.
 * @return {Object}  json objects describes User.
 */
function getRecipients(order) {
    var recipients = [];
    for (var i in order.shipments) {
        var shipment = order.shipments[i];
        recipients.push({
            fullName: shipment.shippingAddress.fullName,
            confirmationEmail: order.customerEmail,
            confirmationPhone: shipment.shippingAddress.phone,
            organization: shipment.shippingAddress.companyName,
            deliveryAddress: {
                streetAddress: shipment.shippingAddress.address1,
                unit: shipment.shippingAddress.address2 || '',
                city: shipment.shippingAddress.city,
                provinceCode: shipment.shippingAddress.stateCode,
                postalCode: shipment.shippingAddress.postalCode,
                countryCode: shipment.shippingAddress.countryCode.value
            }
        });
    }

    return recipients;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Get list of shipments in JSON format
 * acceptable on Stringifyd side
 * * @param {Array} shipments array .
 * @return {Array}  array of shipments as json objects.
 */
function getShipments(shipments) {
    var Ashipments = [];
    for (var i = 0; i < shipments.length; i++) {
        var shipment = shipments[i];
        Ashipments.push({
            shipper: shipment.shippingMethod.custom.signifydShipper.value,
            shippingMethod: shipment.shippingMethod.custom.signifydShippingMethod.value,
            shippingPrice: shipment.shippingTotalGrossPrice.value
        });
    }
    return Ashipments;
}

/**
 * Get Information about customer in JSON format
 * acceptable on Stringifyd side
 *
 * @param {order}  order that just have been placed.
 * @return {result}  json objects describes User.
 */
function getUser(order) {
    var phone;
    if (order.customer.profile.phoneMobile) phone = order.customer.profile.phoneMobile;
    if (order.customer.profile.phoneBusiness) phone = order.customer.profile.phoneBusiness;
    if (order.customer.profile.phoneHome) phone = order.customer.profile.phoneHome;
    var creationCal = new Calendar(order.customer.profile.getCreationDate());
    var updateCal = new Calendar(order.customer.profile.getLastModified());
    return {
        email: order.customer.profile.email,
        username: order.customerName,
        phone: phone,
        createdDate: StringUtils.formatCalendar(creationCal, "yyyy-MM-dd'T'HH:mm:ssZ"),
        accountNumber: order.customer.ID,
        lastUpdateDate: StringUtils.formatCalendar(updateCal, "yyyy-MM-dd'T'HH:mm:ssZ"),
        aggregateOrderCount: order.customer.activeData.orders + 1,
        aggregateOrderDollars: order.customer.activeData.orderValue + order.getTotalGrossPrice().value
    };
}

/**
 * Get information about seller in JSON format
 *
 * @return {Array<Object>} array json object with String attributes.
 */
function getSellers() {
    var settings = sitePrefs.getCustom();// ["SignifydApiKey"];
    //RVW Signifyd OOTB doesn't actually import any of these preferences, its also wrong because it doesn't support multiple wareheouses/stores per site
    return [{
        name: settings.SignifydSellerName,
        domain: settings.SignifydSellerDomain,
        shipFromAddress: {
            streetAddress: settings.SignifydFromStreet,
            unit: settings.SignifydFromUnit,
            city: settings.SignifydFromCity,
            provinceCode: settings.SignifydFromState,
            postalCode: settings.SignifydFromPostCode,
            countryCode: settings.SignifydFromCountry,
            latitude: settings.SignifydFromLatitude,
            longitude: settings.SignifydFromLongitude
        },
        corporateAddress: {
            streetAddress: settings.SignifydCorporateStreet,
            unit: settings.SignifydCorporateUnit,
            city: settings.SignifydCorporateCity,
            provinceCode: settings.SignifydCorporateState,
            postalCode: settings.SignifydCorporatePostCode,
            countryCode: settings.SignifydCorporateCountry,
            latitude: settings.SignifydCorporateLatitude,
            longitude: settings.SignifydCorporateLongitude
        }
    }];
}

/**
 * Get list of products in JSON format
 * acceptable on Stringifyd side
 *
 * @param {order} order Order that just have been placed.
 * @return {result} - array of products as json objects.
 */
function getProducts(order) {
    var result = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var product = order.productLineItems[i];
        result.push({
            itemId: product.productID,
            itemName: product.productName,
            itemUrl: URLUtils.abs('Product-Show', 'pid', product.productID).toString(),
            itemQuantity: product.quantityValue,
            itemPrice: product.grossPrice.value,
            itemIsDigital: product.product.custom.signifydItemIsDigital || false
        });
    }
    for (var i = 0; i < order.giftCertificateLineItems.length; i++) {
        var giftCertificate = order.giftCertificateLineItems[i];
        result.push({
            itemId: 'GC',
            itemName: giftCertificate.lineItemText,
            itemUrl: URLUtils.abs('GiftCertificate-Purchase').toString(),
            itemQuantity: 1,
            itemPrice: giftCertificate.price.value.toFixed(2),
            itemIsDigital: true
        });
    }
    return result;
}


// eslint-disable-next-line valid-jsdoc
/**
 * Sets or increments the retry count for the Order (used in the Job)
 * @param {order} - the current order being integrated
 */
function saveRetryCount(order) {
    Transaction.wrap(function () {
        if (!order.custom.SignifydRetryCount) {
            // eslint-disable-next-line no-param-reassign
            order.custom.SignifydRetryCount = 0;
        }
        // eslint-disable-next-line no-param-reassign,operator-assignment
        order.custom.SignifydRetryCount = order.custom.SignifydRetryCount + 1;
    });
}


// eslint-disable-next-line valid-jsdoc
/**
 * Process data about order when decision was received.
 *
 * @param {body} - body of request from Signifyd.
 */
function process(body) {
    var order = OrderMgr.getOrder(body.orderId);
    var receivedScore = body.score.toString();
    var roundScore = receivedScore;
    if (receivedScore.indexOf('.') >= 0) {
        roundScore = receivedScore.substring(0, receivedScore.indexOf('.'));
    }
    var score = Number(roundScore);
    if (order) {
        if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            Transaction.wrap(function () {
                var orderUrl = body.orderUrl;
                var modifiedUrl = orderUrl.replace(/(.+)\/(\d+)\/(.+)/, 'https://www.signifyd.com/cases/$2');
                //Signifyd calls this endpoint repeatedly for a given order
                //as long as were only subscribed to the guarantees/completion event, they all seem to be duplicates
                //therefore, we can only update the order 1x, because after that it will be placed and we don't want to place it again
                order.custom.SignifydOrderURL = modifiedUrl;
                order.custom.SignifydFraudScore = score;
                if (body.guaranteeDisposition) {
                    if (body.guaranteeDisposition !== 'APPROVED') {
                        order.custom.SignifydGuaranteeDisposition = 'declined';
                    } else {
                        order.custom.SignifydGuaranteeDisposition = 'approved';
                    }
                }

                if (HoldBySignified) {
                    if (body.guaranteeDisposition !== 'APPROVED') {
                        if (body.guaranteeDisposition === 'DECLINED') {
                            // AUTOBAHN MODIFICATION - Cancel or refund the payment if necessary
                            var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
                            paymentHelpers.reversePaymentIfNecessary(order);
                            // END MODIFICATION

                            OrderMgr.failOrder(order);
                        }
                    } else {
                        COHelpers.placeOrder(order, {});
                    }
                } else {
                    COHelpers.placeOrder(order, {});
                }
            });
        } else {
            //Race condition, order not yet in status created (finishing PlaceOrder taking longer than async callback to signifyd servers
            //Signifyd will retry
            order = '';
        }
    } else if (body.uuid === '709b9107-eda0-4cdd-bdac-a82f51a8a3f3' && body.orderId === '19418') {
        // Dummy order sent by Signifyd API test message, return dummy data
        order = {
            custom: {
                SignifydGuaranteeDisposition: body.guaranteeDisposition.toLowerCase(),
                SignifydFraudScore: score,
                SignifydOrderURL: body.orderUrl.replace(/(.+)\/(\d+)\/(.+)/, 'https://www.signifyd.com/cases/$2')
            },
            exportStatus: dw.order.Order.EXPORT_STATUS_READY
        }
    } else {
        Logger.getLogger('Signifyd', 'signifyd').error('An error===>>>: There is no order with ID = {0}', body.orderId);
        order = '';
    }

    return order;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Receive decision about case related to order.
 * Validate signifyd server by api key and
 * delegate processing to next method.
 *
 * @param {request} - http request with body and headers.
 */
exports.Callback = function (request) {
    if (EnableCartridge) {
        try {
            var body = request.httpParameterMap.getRequestBodyAsString();
            var headers = request.getHttpHeaders();
            Logger.getLogger('Signifyd', 'signifyd').debug('Debug: API callback header x-signifyd-topic: {0}', headers.get('x-signifyd-topic'));
            Logger.getLogger('Signifyd', 'signifyd').debug('Debug: API callback body: {0}', body);
            var parsedBody = JSON.parse(body);
            var hmacKey = headers.get('x-signifyd-sec-hmac-sha256');
            var crypt = new Mac(Mac.HMAC_SHA_256);
            var cryptedBody;
            if (headers.get('x-signifyd-topic') === 'cases/test') {
                cryptedBody = crypt.digest(body, 'ABCDE');
            } else {
                cryptedBody = crypt.digest(body, APIkey);
            }
            var cryptedBodyString = Encoding.toBase64(cryptedBody);
            if (cryptedBodyString.equals(hmacKey)) {
                return process(parsedBody);
            } else {
                Logger.getLogger('Signifyd', 'signifyd').error('An error===>>>: Request is not Authorized. Please check an API key.');
            }
        } catch (e) {
            var ex = e;
            Logger.getLogger('Signifyd', 'signifyd').error('Error: API Callback processing was interrupted because:{0}', ex.message);
        }
    }
};

/**
 * Generates an unique ID to use in Signifyd Fingerprint
 *
 * @return {deviceFingerprintID} - The generated finger print id
 */
function getOrderSessionId(basketUUID) {
    if (EnableCartridge) {
        var storefrontBaseUrl = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');
        var storeURL = storefrontBaseUrl;
        var urlString = '';
        try {
            var urlObj = new URL(storeURL);
            urlString = urlObj.protocol + '//' + urlObj.host + urlObj.pathname;
        } catch (e) {
            // fallback if not a valid URL
            urlString = storeURL;
        }
        var basketID = basketUUID || BasketMgr.getCurrentOrNewBasket().getUUID();
        var orderSessionId = StringUtils.encodeBase64(urlString + basketID);
        return orderSessionId;
    }
    return null;
}


/**
 * Save the orderSessionId to the order
 * @param {order} order the recently created order
 * @param {orderSessionId} orderSessionId the order session id for the signifyd fingerprint
 */
function setOrderSessionId(order, orderSessionId) {
    if (EnableCartridge && orderSessionId) {
        Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
            order.custom.SignifydOrderSessionId = orderSessionId;
        });
    }
}

function getTransactions(order) {
    var HookManager = require('dw/system/HookMgr');
    var PaymentManager = require('dw/order/PaymentMgr');
    var transactions = [];
    for (var i in order.paymentInstruments) {
        var paymentInstrument = order.paymentInstruments[i];
        var paymentProcessorID = PaymentManager.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor.ID.toLowerCase();

        var hookResult;
        if (HookManager.hasHook('signifyd.api.request.payment.' + paymentProcessorID)) {
            hookResult = HookManager.callHook('signifyd.api.request.payment.' + paymentProcessorID,
                'buildTransaction',
                paymentInstrument,
                order
            );
        } else {
            Logger.getLogger('Signifyd', 'signifyd').error('Signifyd integration needs custom coding to support : ' + paymentProcessorID);
            hookResult = HookManager.callHook('signifyd.api.request.payment.default',
                'buildTransaction',
                paymentInstrument,
                order
            );
        }

        if (hookResult) {
            transactions.push(hookResult);
        }
    }

    return transactions;
}

function getDiscountCodes(order) {
    var discountCodes = [];
    for (var i in order.priceAdjustments) {
        var priceAdjustment = order.priceAdjustments[i];

        var discount = {
            code: null
        };

        if (priceAdjustment.couponLineItem) {
            discount.code = priceAdjustment.couponLineItem.couponCode
        }

        if (priceAdjustment.appliedDiscount) {
            switch (priceAdjustment.appliedDiscount.type) {
                case dw.campaign.Discount.TYPE_AMOUNT: {
                    discount.amount = priceAdjustment.appliedDiscount.amount;
                    discount.percentage = null;
                    if (!discount.code) {
                        //signifyd api requires a discount code with a discount amount so fallback to promotionID
                        discount.code = priceAdjustment.promotionID;
                    }
                    discountCodes.push(discount);
                    break;
                }
                case dw.campaign.Discount.TYPE_BONUS:
                case dw.campaign.Discount.TYPE_BONUS_CHOICE:
                case dw.campaign.Discount.TYPE_FREE:
                case dw.campaign.Discount.TYPE_FREE_SHIPPING: {
                    discount.amount = null;
                    discount.percentage = 100;
                    discountCodes.push(discount);
                    break;
                }
                case dw.campaign.Discount.TYPE_PERCENTAGE:
                case dw.campaign.Discount.TYPE_PERCENTAGE_OFF_OPTIONS: {
                    discount.amount = null;
                    discount.percentage = priceAdjustment.appliedDiscount.percentage;
                    discountCodes.push(discount);
                    break;
                }
                //signifyd api not smart enough + sfcc not robust enough to provide meaningful data
                case dw.campaign.Discount.TYPE_FIXED_PRICE:
                case dw.campaign.Discount.TYPE_FIXED_PRICE_SHIPPING:
                case dw.campaign.Discount.TYPE_PRICEBOOK_PRICE:
                case dw.campaign.Discount.TYPE_TOTAL_FIXED_PRICE:
                default: {
                    break;
                }
            }
        }
    }

    return discountCodes;
}


/**
 * Converts an Order into JSON format
 * acceptable on Stringifyd side
 *
 * @param {order} order Order that just have been placed.
 * @return {result} the json objects describes Order.
 */
function getParams(order) {
    var cal = new Calendar(order.creationDate);
    var params = {
        purchase: {
            orderId: order.currentOrderNo,
            orderSessionId: order.custom.SignifydOrderSessionId,
            browserIpAddress: order.remoteHost,
            shipments: getShipments(order.shipments),
            products: getProducts(order),
            createdAt: StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ"),
            currency: order.currencyCode,
            orderChannel: 'WEB',
            totalPrice: order.getTotalGrossPrice().value,
            discountCodes: getDiscountCodes(order)
        },
        recipients: getRecipients(order),
        transactions: getTransactions(order)
    };

    if (order.customer.profile) {
        params.userAccount = getUser(order);
    }

    return params;
}


// eslint-disable-next-line valid-jsdoc
/**
 * Send Signifyd order info and
 * store case id as an attribute of order in DW.
 *
 * @param {Object} - Order that just have been placed.
 * @returns  {number} on error.
 */
exports.Call = function (order) {
    if (EnableCartridge) {
        if (order && order.currentOrderNo) {
            Logger.getLogger('Signifyd', 'signifyd').info('Info: API call for order {0}', order.currentOrderNo);
            var params = getParams(order);
            Logger.getLogger('Signifyd', 'signifyd').debug('Debug: API call body: {0}', JSON.stringify(params));
            var service = signifydInit.createCase();
            if (service) {
                try {
                    saveRetryCount(order);
                    var result = service.call(params);
                    if (result.ok) {
                        var answer = JSON.parse(result.object);
                        var caseId = answer.investigationId;
                        Transaction.wrap(function () {
                            // eslint-disable-next-line no-param-reassign
                            // WGACA MODIFICATION - simple typecast for number value caseIDs
                            // order.custom.SignifydCaseID = caseId;
                            order.custom.SignifydCaseID = '' + caseId;
                        });
                        return caseId;
                    }
                    Logger.getLogger('Signifyd', 'signifyd').error('Error: {0} : {1}', result.error, result.errorMessage);
                } catch (e) {
                    Logger.getLogger('Signifyd', 'signifyd').error('Error: API Call was interrupted unexpectedly. Exception: {0}', e.message);
                }
            } else {
                Logger.getLogger('Signifyd', 'signifyd').error('Error: Service Please provide correct order for Call method');
            }
        } else {
            Logger.getLogger('Signifyd', 'signifyd').error('Error: Please provide correct order for Call method');
        }
    }

    return 0;
};

exports.setOrderSessionId = setOrderSessionId;
exports.getOrderSessionId = getOrderSessionId;
exports.getSellers = getSellers;
