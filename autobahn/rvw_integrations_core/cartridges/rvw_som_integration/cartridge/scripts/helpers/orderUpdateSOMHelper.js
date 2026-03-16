'use strict';

var dwSystemCurrentSite = require('dw/system/Site').getCurrent();
var dwOrderOrderMgr = require('dw/order/OrderMgr');
var dwOrderOrder = require('dw/order/Order');
var dwUtilCalendar = require('dw/util/Calendar');
var dwSystemTransaction = require('dw/system/Transaction');

var dwCryptoMessageDigest = require('dw/crypto/MessageDigest');
var dwCryptoEncoding = require('dw/crypto/Encoding');
var dwUtilBytes = require('dw/util/Bytes');

var dwSystemLogger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');

var SOMConstants = require('*/cartridge/scripts/util/SOMConstants');

var exports = {};

var emailEventQueue = {};

/**
 * Update DW Orders & return status JSON Object
 * @param {String} event - String that contains status event
 * @param {dw.order.Order} order - Order Object
 * @param {dw.order.LineItem} - LineItem Object
 * @returns {boolean} Status Response Object
 */
function pushToEmailQueue (event, order, withTracking) {
    if (!order) {
        dwSystemLogger.warn(event + " event could not be triggered, order was not found.");
    } else {
        var orderID = order.getOrderNo();
        emailEventQueue[event] = emailEventQueue[event] || {};
        emailEventQueue[event][orderID] = emailEventQueue[event][orderID] || {};
        emailEventQueue[event][orderID] = {order: order, withTracking: emailEventQueue[event][orderID].withTracking || withTracking};

        return true;
    }

    return false;
};

/**
 * Update Gift Certificates by calling hook
 * @param {String} event - String that contains status event
 * @param {dw.order.LineItem} - LineItem Object
 * @returns {boolean} Status Response Object
 */
 function updateGiftCertificate (lineItem) {
    var HookMgr = require('dw/system/HookMgr');
    var status = false;

    if (HookMgr.hasHook('app.activate.giftCertificate')) {
        status = HookMgr.callHook('app.activate.giftCertificate', 'activateGiftCertificate', lineItem);
    }

    return status;
};

/**
 * Update DW Orders & return status JSON Object
 * @param {Object} statusObject - String that contains request secret
 * @param {dw.order.Order} - Order Object
 * @returns {Object} Status Response Object
 */
function updateDWOrder (statusObject, dwOrder) {
    // Response details object returned to SOM
    var orderResp = {
        orderId: statusObject.orderId,
        status: SOMConstants.communicationStatus['ORDER']['LOCKED'],
        lineItems: []
    };

    if (empty(dwOrder)) {
        orderResp.status = SOMConstants.communicationStatus['ORDER']['NOT_FOUND'];
        orderResp.message = SOMConstants.communicationStatus['ORDER']['ORDERPREF'];
    } else {
        // Update order status from SOM into bucketed SFCC Groups
        SOMConstants.systemOrderStatus.forEach(function (status) {
            // Pull Comma Seperated SOM Statuses Bucket SitePref, remove trailing spaces, replace line breaks, replace
            var somCommunicationStatusBucket = (dwSystemCurrentSite.getCustomPreferenceValue(SOMConstants.customAttrPrefix + 'StatusBucket_' + status) || '')
                .replace(/,\s+|\s+,/gi,',')
                .replace(/[\n\r]/gi,',')
                .replace(/,+/gi,',')
                .split(',');

            if (somCommunicationStatusBucket.indexOf(statusObject.orderStatus) !== -1) {
                // Only trigger per changed external status
                if (dwOrder.getExternalOrderStatus() !== statusObject.orderStatus) {
                    pushToEmailQueue(status, dwOrder);
                }

                /*
                    NOT ALLOWED:
                        dw.order.Order.setStatus: ERR "Status of integrated orders cannot be changed."
                        dw.order.OrderMgr.cancelOrder: ERR "Error during #cancelOrder. Marking transaction as 'rollback only'. No changes will be persisted into the database."

                    var targetOrderStatusMethod = SOMConstants.systemOrderMgrStatusMethodMap[status];

                    dwSystemTransaction.begin();
                    try {
                        dwOrder.setStatus(dwOrderOrder[status]);
                    } catch (err) {
                        dwSystemLogger.warn("dw.order.Order.setStatus method err: " + err);

                        if (!empty(targetOrderStatusMethod) && targetOrderStatusMethod in dwOrderOrderMgr) {
                            try {
                                dwOrderOrderMgr[targetOrderStatusMethod](dwOrder);
                            } catch (err) {
                                dwSystemLogger.warn("dw.order.OrderMgr[targetOrderStatusMethod: " + targetOrderStatusMethod + "] method err: " + err);
                            }
                        }
                    }
                    dwSystemTransaction.commit();
                */

                dwSystemTransaction.begin();
                dwOrder.setExternalOrderStatus(statusObject.orderStatus);
                dwOrder.custom.paymentStatus = statusObject.paymentStatus || dwOrder.custom.paymentStatus;
``
                // Track Order Change field has 4000 character max lemgth limit
                let StatusObjectString = JSON.stringify(statusObject);
                let sfccLimit = 4000;
                let statusPrefix = 'SOM Update: ';
                for (let lengthLimit = 0; lengthLimit <= StatusObjectString; lengthLimit += (sfccLimit - statusPrefix.length)) {
                    dwOrder.trackOrderChange(statusPrefix + StatusObjectString.slice(lengthLimit, lengthLimit + (sfccLimit - statusPrefix.length)));
                }

                orderResp.status = SOMConstants.communicationStatus['ORDER']['ACCEPTED'];
                dwSystemTransaction.commit();
            }
        });
    }

    return orderResp;
};

/**
 * Update DW LineItem & return status JSON Object
 * @param {Object} statusObject - String that contains request secret
 * @param {Array} - Array of dw.order.LineItem Objects
 * @returns {Object} Status Response Object
 */
function updateDWLineItem (statusObject, dwLineItems) {
    // Response details object returned to SOM Order
    var lineItemResp = {
        somId: statusObject.somId,
        productId: statusObject.productId,
        status: SOMConstants.communicationStatus['LINE_ITEM']['LOCKED']
    };

    if (empty(statusObject) || empty(statusObject.quantity) || statusObject.quantity < 0 || statusObject.quantityCanceled < 0 || statusObject.quantityReturned < 0 || statusObject.quantityOrdered <= 0  || ('quantityFulfilled' in statusObject && statusObject.quantityFulfilled <= 0)) {
        lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['FORMAT_ERR'];
    } else {
        var dwLineItem = dwLineItems && dwLineItems.length > 0 ? dwLineItems[0] : null;

        if (empty(dwLineItems) || dwLineItems.length === 0) {
            lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['NOT_FOUND'];
        } else if (dwLineItems.length !== 1) {
            lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['MULTI_MATCH'];
        } else {
            // Calculate event recency
            var nowCalendar = new dwUtilCalendar();
            var updateDate = !empty(statusObject.eventCreationDate) ? new Date(statusObject.eventCreationDate) : null;
            var updateCalendar = !empty(updateDate) ? new dwUtilCalendar(updateDate) : null;
            var lastUpdateDate = !empty(dwLineItem.custom.lastUpdateDate) ? dwLineItem.custom.lastUpdateDate : null;
            var lastUpdateCalendar = !empty(lastUpdateDate) ? new dwUtilCalendar(lastUpdateDate) : null;

            // Validate event is not in the future of now moment
            if (empty(updateCalendar) || nowCalendar.compareTo(updateCalendar) < 0) {
                lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['EVENTDATE_ERROR'];

            // Validate recency
            } else if (!empty(lastUpdateCalendar) && lastUpdateCalendar.compareTo(updateCalendar) > 0) {
                lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['EVENTDATE_RANGE_IGNORE'];

            } else {
                // translate comma seperated list to Array
                var trackingNumbers = [];

                if (statusObject.trackingNumbers && statusObject.trackingNumbers.length > 0) {
                    statusObject.trackingNumbers.forEach(function (trackingNum) {
                        if (empty(trackingNum)) {
                            return true;
                        }

                        trackingNum = trackingNum.replace(/,/gi, '');

                        trackingNumbers.push(trackingNum);
                    });
                }

                // Update order lineitem status from SOM into bucketed SFCC Groups
                SOMConstants.customLineItemStatus.forEach(function (status) {
                    // Pull Comma Seperated SOM Statuses Bucket SitePref, remove trailing spaces, replace line breaks, replace
                    var somCommunicationStatusBucket = (dwSystemCurrentSite.getCustomPreferenceValue(SOMConstants.customAttrPrefix + 'StatusBucket_' + status) || '')
                        .replace(/,\s+|\s+,/gi,',')
                        .replace(/[\n\r]/gi,',')
                        .replace(/,+/gi,',')
                        .split(',');

                    if (somCommunicationStatusBucket.indexOf(statusObject.lineItemStatus) !== -1) {
                        let currentStatus = 'externalLineItemStatus' in dwLineItem ? dwLineItem.externalLineItemStatus : dwLineItem.custom.externalLineItemStatus;
                        let trackingNumberStr = trackingNumbers.join(',').replace(/^(\s+)?,/gi,'')

                        if (statusObject.lineItemType !== 'Delivery Charge' && statusObject.productId !== 'eGiftCertificate') {
                            // Check for partial line item returns or cancelations as SOM will report ORDERED status
                            if ([SOMConstants.customLineItemStatusCanceled, SOMConstants.customLineItemStatusReturned].indexOf(status) === -1) {
                                let currentLIQty = !empty(dwLineItem.custom.quantityOrdered) ? dwLineItem.custom.quantityOrdered : dwLineItem.quantityValue;
                                // Determine if line item qty is return-cancel or increase (order on behalf of)
                                if (currentLIQty < statusObject.quantity) {
                                    //Order on Behalf of not supported
                                    lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['FORMAT_ERR'];
                                    return true;
                                }

                                if ((dwLineItem.custom.quantityCanceled || 0) !== statusObject.quantityCanceled) {
                                    pushToEmailQueue(SOMConstants.customLineItemStatusCanceled, dwLineItem.getLineItemCtnr());
                                }

                                if ((dwLineItem.custom.quantityReturned || 0) !== statusObject.quantityReturned) {
                                    pushToEmailQueue(SOMConstants.customLineItemStatusReturned, dwLineItem.getLineItemCtnr());
                                }
                            }

                            // Only trigger email if external lineItem status is changed or tracking number has changed
                            if (currentStatus !== statusObject.lineItemStatus
                                || (!empty(trackingNumberStr) && dwLineItem.custom.trackingNumbersList !== trackingNumberStr)) {
                                pushToEmailQueue(status, dwLineItem.getLineItemCtnr(), !empty(trackingNumberStr));
                            }
                        }

                        dwSystemTransaction.begin();

                        //Update EXT STATUS
                        if ('externalLineItemStatus' in dwLineItem) {
                            dwLineItem.setExternalLineItemStatus(statusObject.lineItemStatus);
                        } else {
                            dwLineItem.custom.externalLineItemStatus = statusObject.lineItemStatus;
                        }

                        //Update TRACKING NUMBERS
                        if (trackingNumbers.length > 0) {
                            try {
                                dwLineItem.custom.trackingNumbersList = trackingNumberStr;
                            } catch (err) {
                                lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['SHIPPING_LINE_ITEM_NOTRACK'];
                            }
                        }

                        if (dwLineItem.custom.status !== 'ITEM_STATUS_FULFILLED' && status === 'ITEM_STATUS_FULFILLED' && 'giftCertificateID' in dwLineItem) {
                            lineItemResp.giftCertificateUpdated = updateGiftCertificate(dwLineItem);
                        }

                        //Update STATUS DATE
                        dwLineItem.custom.lastUpdateDate = updateDate;
                        dwLineItem.custom.status = status;

                        //Update QTY
                        if (statusObject.lineItemType !== 'Delivery Charge') {
                            dwLineItem.custom.quantityCanceled = statusObject.quantityCanceled || dwLineItem.custom.quantityCanceled;
                            dwLineItem.custom.quantityReturned = statusObject.quantityReturned || dwLineItem.custom.quantityReturned;
                            dwLineItem.custom.quantityFulfilled = statusObject.quantityFulfilled || dwLineItem.custom.quantityFulfilled;
                            dwLineItem.custom.quantityOrdered = statusObject.quantity || dwLineItem.custom.quantityOrdered;
                        }

                        dwSystemTransaction.commit();

                        lineItemResp.status = SOMConstants.communicationStatus['LINE_ITEM']['ACCEPTED'];
                    }
                });

                lineItemResp.lastUpdateDate = updateDate;
            }
        }
    }

    return lineItemResp;
};

/**
 * Authenticate Request XSecret Hash via system custom attributes
 * @param {string} hashRequest - String that contains request secret
 * @returns {boolean} - String with the generated address name
 */
exports.authenticateRequest = function (hashRequest) {
    var secret = dwSystemCurrentSite.getCustomPreferenceValue(SOMConstants.customAttrPrefix + 'Auth_Secret');
    var salt = dwSystemCurrentSite.getCustomPreferenceValue(SOMConstants.customAttrPrefix + 'Auth_Salt');
    var dwSecretBytes = new dwUtilBytes(secret + salt);
    var dwDigestObj = new dwCryptoMessageDigest(dwCryptoMessageDigest['DIGEST_SHA_256']);
    var hash = dwCryptoEncoding.toBase64(dwDigestObj.digestBytes(dwSecretBytes));

    // Validate request permission, return tru if invalid
    return empty(hashRequest) || hashRequest !== hash;
};

/**
 * Process Request body
 * @param {Object} orders - String that contains request secret
 * @returns {Object} - String with the generated address name
 */
exports.processOrders = function (orders) {
    var responseObj = [];

    // Loop through Orders
    orders.forEach(function (orderObj) {
        var dwOrder;

        try {
            dwOrder = !empty(orderObj.orderId) ? dwOrderOrderMgr.getOrder(orderObj.orderId) : null;
        } catch (error) {
            dwSystemLogger.warn('SOM Helper: [orderUpdateSOMHelper.js] Order Accesses issue.');
            dwSystemLogger.warn(error);
        }

        var dwShipments = !empty(dwOrder) ? dwOrder.getShipments() : null;

        // Response details object returned to SOM
        var orderResp = updateDWOrder(orderObj, dwOrder);

        if (!empty(dwShipments) && dwShipments.length > 0) {
            // Update LineItems
            if (orderObj.lineItems && orderObj.lineItems.length > 0) {
                // Create Lookups HashMaps
                var somCCUUIDMap = {};
                var productIDMap = {};
                var giftCertIDMap = {};
                var shipmentIDMap = {};

                dwShipments.toArray().forEach(function (dwShipment) {
                    var productLineItems = dwShipment.getProductLineItems();
                    if (productLineItems.length > 0) {
                        // Validate LineItem Custom Attr Dependancies
                        try {
                            let dwLineItem = productLineItems[0];

                            dwSystemTransaction.begin();
                            dwLineItem.custom.somCC_UUID = dwLineItem.custom.somCC_UUID;
                            dwLineItem.custom.rvw_autobahn__somCC_UUID = dwLineItem.custom.rvw_autobahn__somCC_UUID;
                            dwLineItem.custom.lastUpdateDate = dwLineItem.custom.lastUpdateDate || new Date(0);
                            dwLineItem.custom.trackingNumbersList = (dwLineItem.custom.trackingNumbersList || '');
                            // NATIVE AVAILABLE dwLineItem.custom.externalLineItemStatus = (dwLineItem.custom.externalLineItemStatus || '');
                            dwLineItem.custom.status = (dwLineItem.custom.status|| '');

                            dwLineItem.custom.quantityCanceled = dwLineItem.custom.quantityCanceled;
                            dwLineItem.custom.quantityReturned = dwLineItem.custom.quantityReturned;
                            dwLineItem.custom.quantityFulfilled = dwLineItem.custom.quantityFulfilled;
                            dwLineItem.custom.quantityOrdered = dwLineItem.custom.quantityOrdered;

                            dwSystemTransaction.rollback();
                        } catch(err) {
                            throw new Error('Missing ProductLineItem custom attribute definition: ' + err);
                        }
                    }

                    var giftCertificateItems = dwShipment.getGiftCertificateLineItems();
                    if (giftCertificateItems.length > 0) {
                        // Validate LineItem Custom Attr Dependencies
                        try {
                            let dwLineItem = giftCertificateItems[0];

                            dwSystemTransaction.begin();
                            dwLineItem.custom.somCC_UUID = dwLineItem.custom.somCC_UUID;
                            dwLineItem.custom.rvw_autobahn__somCC_UUID = dwLineItem.custom.rvw_autobahn__somCC_UUID;
                            dwLineItem.custom.lastUpdateDate = dwLineItem.custom.lastUpdateDate || new Date(0);
                            dwLineItem.custom.status = (dwLineItem.custom.status|| '');

                            dwLineItem.custom.quantityCanceled = dwLineItem.custom.quantityCanceled;
                            dwLineItem.custom.quantityReturned = dwLineItem.custom.quantityReturned;
                            dwLineItem.custom.quantityFulfilled = dwLineItem.custom.quantityFulfilled;
                            dwLineItem.custom.quantityOrdered = dwLineItem.custom.quantityOrdered;

                            dwSystemTransaction.rollback();
                        } catch(err) {
                            throw new Error('Missing GiftCertificateItem custom attribute definition: ' + err);
                        }
                    }

                    var shippingLineItems = dwShipment.getShippingLineItems();
                    if (shippingLineItems.length > 0) {
                        // Validate LineItem Custom Attr Dependancies
                        try {
                            let dwLineItem = shippingLineItems[0];

                            dwSystemTransaction.begin();
                            dwLineItem.custom.somCC_UUID = dwLineItem.custom.somCC_UUID;
                            dwLineItem.custom.rvw_autobahn__somCC_UUID = dwLineItem.custom.rvw_autobahn__somCC_UUID;
                            dwLineItem.custom.lastUpdateDate = dwLineItem.custom.lastUpdateDate || new Date(0);
                            // NOT REQUIRED dwLineItem.custom.trackingNumbersList = (dwLineItem.custom.trackingNumbersList || '');
                            dwLineItem.custom.externalLineItemStatus = (dwLineItem.custom.externalLineItemStatus || '');
                            dwLineItem.custom.status = (dwLineItem.custom.status|| '');
                            dwSystemTransaction.rollback();
                        } catch(err) {
                            throw new Error('Missing ShippingLineItem custom attribute definition: ' + err);
                        }
                    }
                    // Build Product Lookup Maps
                    productLineItems.toArray().forEach(function (dwLineItem) {
                        var ccUUID = dwLineItem.custom.somCC_UUID || dwLineItem.custom.rvw_autobahn__somCC_UUID;

                        // Create UUID Lookup Entry
                        if (!empty(ccUUID)) {
                            somCCUUIDMap[ccUUID] = somCCUUIDMap[ccUUID] || [];
                            somCCUUIDMap[ccUUID].push(dwLineItem);
                        }

                        var productID = dwLineItem.getProductID();

                        // Create PID Lookup Entry
                        if (!empty(productID)) {
                            productIDMap[productID] = productIDMap[productID] || [];
                            productIDMap[productID].push(dwLineItem);
                        }
                    });

                    // Build Gift Cert Lookup Map
                    giftCertificateItems.toArray().forEach(function (dwLineItem) {
                        var ccUUID = dwLineItem.custom.somCC_UUID || dwLineItem.custom.rvw_autobahn__somCC_UUID;

                        // Create UUID Lookup Entry
                        if (!empty(ccUUID)) {
                            somCCUUIDMap[ccUUID] = somCCUUIDMap[ccUUID] || [];
                            somCCUUIDMap[ccUUID].push(dwLineItem);
                        }

                        var giftCertID = dwShipment.getID();

                        // Create PID Lookup Entry
                        if (!empty(giftCertID)) {
                            giftCertIDMap[giftCertID] = productIDMap[giftCertID] || [];
                            giftCertIDMap[giftCertID].push(dwLineItem);
                        }
                    });

                    // Build Shipment Lookup Map
                    shippingLineItems.toArray().forEach(function (dwLineItem) {
                        var ccUUID = dwLineItem.custom.somCC_UUID || dwLineItem.custom.rvw_autobahn__somCC_UUID;

                        // Create UUID Lookup Entry
                        if (!empty(ccUUID)) {
                            somCCUUIDMap[ccUUID] = somCCUUIDMap[ccUUID] || [];
                            somCCUUIDMap[ccUUID].push(dwLineItem);
                        }

                        var shipmentID = dwShipment.getID();

                        // Create PID Lookup Entry
                        if (!empty(shipmentID)) {
                            shipmentIDMap[shipmentID] = productIDMap[shipmentID] || [];
                            shipmentIDMap[shipmentID].push(dwLineItem);
                        }
                    });
                });

                orderObj.lineItems.forEach(function(lineItemObj) {
                    // Find dwLineItem by ccUUID, productId, or relatedLineItemUUID
                    var dwLineItems = !empty(lineItemObj.ccUUID) ? somCCUUIDMap[lineItemObj.ccUUID] : null;

                    if (empty(dwLineItems)) {
                        if (lineItemObj.lineItemType === 'Order Product') {
                            if (lineItemObj.productId === 'eGiftCertificate') {
                                dwLineItems = giftCertIDMap[lineItemObj.productId];
                            } else {
                                dwLineItems = productIDMap[lineItemObj.productId];
                            }
                        } else if (lineItemObj.lineItemType === 'Delivery Charge') {
                            let relatedProductLineItem = somCCUUIDMap[lineItemObj.relatedLineItemUUID] || [];

                            relatedProductLineItem.forEach(function (lineItem) {
                                if (empty(dwLineItems) && !empty(lineItem)) {
                                    let lineItemShipment = lineItem.getShipment();

                                    dwLineItems = !empty(lineItemShipment) ? shipmentIDMap[lineItemShipment.getID()] : null;
                                }
                            });
                        }
                    }

                    // Response details object returned to SOM Order
                    var lineItemResp = updateDWLineItem(lineItemObj, dwLineItems);

                    orderResp.lineItems.push(lineItemResp);
                });
            }
        }

        responseObj.push(orderResp);
    });

    return responseObj;
};

/**
 * Prcess Response body
 * @param {string} locale - String locale ID
 * @returns {Object} - String with the generated address name
 */
exports.triggerEmailEvents = function (locale) {
    var OrderModel = require('*/cartridge/models/order');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var dwLocale = require('dw/util/Locale');
    var dwResource = require('dw/web/Resource');

    var currentLocale = dwLocale.getLocale(locale);

    Object.keys(emailEventQueue).forEach(function (eventLabel) {
        // Is Send Email Flag enabled
        if (dwSystemCurrentSite.getCustomPreferenceValue(SOMConstants.customAttrPrefix + 'Email_' + eventLabel)) {
            Object.keys(emailEventQueue[eventLabel]).forEach(function (orderID) {
                var dwOrder = emailEventQueue[eventLabel][orderID].order;

                var orderModel = new OrderModel(dwOrder, { countryCode: currentLocale.country, containerView: 'order' });

                var orderObject = { order: orderModel };

                var emailObj = {
                    to: dwOrder.customerEmail,
                    subject: dwResource.msgf('subject.order.' + eventLabel + '.email', 'order', 'Order Update', dwOrder.getOrderNo()),
                    from: dwSystemCurrentSite.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
                    type: emailHelpers.emailTypes[eventLabel]
                };

                if (SOMConstants.customLineItemStatusWithTracking.indexOf(eventLabel) !== -1 && emailEventQueue[eventLabel][orderID].withTracking) {
                    emailObj.subject = dwResource.msgf('subject.order.' + eventLabel + '.WITH_TRACKING.email', 'order', 'Order Update', dwOrder.getOrderNo());
                    orderObject.showTrackingInformation = true;
                }

                emailHelpers.sendEmail(emailObj, 'orders/status/statusUpdateEmail', orderObject);
            });
        }
    });
};

module.exports = exports;
