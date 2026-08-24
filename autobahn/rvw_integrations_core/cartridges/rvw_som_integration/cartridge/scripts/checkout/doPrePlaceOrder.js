
var base = module.superModule || {};

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var dwLogger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');
var images = require('*/cartridge/models/product/decorators/images');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');

function buildStorefrontUrl(path, fallbackUrl) {
    var storefrontBaseUrl = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');

    if (empty(storefrontBaseUrl) || empty(path)) {
        return fallbackUrl || '';
    }

    var baseUrl = storefrontBaseUrl.toString().replace(/\/$/, '');
    var relativePath = path.toString().replace(/^https?:\/\/[^/]+/i, '');

    if (relativePath.indexOf('/') !== 0) {
        relativePath = '/' + relativePath;
    }

    return baseUrl + relativePath;
}

function addUnique(values, value) {
    if (!empty(value) && values.indexOf(value) === -1) {
        values.push(value);
    }
}

function getCustomValue(customAttributes, attributeID) {
    var value;

    try {
        if (!customAttributes || !(attributeID in customAttributes)) {
            return '';
        }

        value = customAttributes[attributeID];

        if (empty(value)) {
            return '';
        }

        return value.toString();
    } catch (e) {
        return '';
    }
}

function getCustomBoolean(customAttributes, attributeID) {
    try {
        return !!(customAttributes && attributeID in customAttributes && customAttributes[attributeID]);
    } catch (e) {
        return false;
    }
}

// liveSellingEventID/HostName/EventDate/BadgeText are static and shared across the current event, so they're Site Preferences rather than per-line-item custom attributes.
function getSitePreferenceValue(prefID) {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue(prefID);
        return empty(value) ? '' : value.toString();
    } catch (e) {
        return '';
    }
}

// Reads a boolean custom attribute as tri-state, so an agent's explicit choice can be told apart from a field that was never touched (undefined).
function getCustomBooleanTriState(customAttributes, attributeID) {
    try {
        if (!customAttributes || !(attributeID in customAttributes)) {
            return undefined;
        }

        var value = customAttributes[attributeID];

        if (value === null || value === undefined) {
            return undefined;
        }

        return !!value;
    } catch (e) {
        return undefined;
    }
}

/**
 * Allows an override for integrations to implement logic after an order is placed.
 * @param {dw.order.Order} order - The order object to be placed
 */
function doPrePlaceOrder(order) {
    if (!empty(order)) {
        var dwTransaction = require('dw/system/Transaction');
        var somOrderHelper = require('*/cartridge/scripts/checkout/SomOrderHelper');
        var orderEventService = require('*/cartridge/scripts/services/orderEventITPFservice');
        var zetaTrackEventService = require('*/cartridge/scripts/services/zetaTrackEventService');
        var shipments = order.getShipments();
        var billingAddress = order.getBillingAddress();
        var isLiveSellingOrder = false;
        var isCSCHandoffOrder = false;
        var liveSellingHostNames = [];
        var liveSellingEventSummaries = [];
        if (shipments.length > 0) {
            dwTransaction.begin();
            order.custom.somCC_checkoutStorefront = somOrderHelper.GetOrderCheckoutStorefront(order);
            order.custom.rvw_autobahn__somCC_checkoutStorefront = order.custom.somCC_checkoutStorefront;

            order.custom.somCC_customerID = order.customer && order.customer.ID;
            order.custom.somCC_customerNo = order.customerNo;

            shipments.toArray().forEach(function (shipment) {
                var productLineItems = shipment.getProductLineItems();
                var giftCertificateItems = shipment.getGiftCertificateLineItems();
                var shippingLineItems = shipment.getShippingLineItems();

                // Product Line Items only
                (productLineItems.length > 0 ? productLineItems.toArray() : [])
                .forEach(function(lineItem) {
                    try {
                        var product = lineItem && lineItem.product;
                        var isCSCLineItem = getCustomBoolean(lineItem.custom, 'isCSCHandoffLineItem');

                        if (isCSCLineItem) {
                            isCSCHandoffOrder = true;
                        }

                        if (!empty(product)) {
                            // Stricter than the cart-side locking check - for order-level reporting, only the agent's explicit "Is Live Selling Line Item" = true counts, not the catalog product's own flag.
                            var agentLiveSellingChoice = getCustomBooleanTriState(lineItem.custom, 'isLiveSellingLineItem');
                            var lineItemIsLiveSelling = isCSCLineItem && agentLiveSellingChoice === true;

                            if (lineItemIsLiveSelling) {
                                try {
                                    var liveSellingItemID = getCustomValue(product.custom, 'liveSellingItemID') || product.ID;
                                    // Host name/event summary are static Site Preferences for the whole event - whatever the agent typed into the line item's own field is ignored.
                                    var liveSellingHostName = getSitePreferenceValue('liveSellingHostName');
                                    var liveSellingEventSummary = getSitePreferenceValue('liveSellingEventSummary');

                                    isLiveSellingOrder = true;
                                    lineItem.custom.isLiveSellingLineItem = true;
                                    lineItem.custom.liveSellingItemID = liveSellingItemID;

                                    // Read-only safety check - payment is already authorized against the order total by this point, so we can only log a mismatch, never fix it here.
                                    if (!liveSellingPriceAdjustmentHelper.isAdjustmentCorrect(lineItem)) {
                                        dwLogger.error('Live selling price adjustment is missing/incorrect on an already-priced order line item (product {0}, order line item {1}) - order total may not reflect the live selling price.', product.ID, lineItem.UUID);
                                    }

                                    // Host name/event summary aren't duplicated onto the line item - the order-level copy (aggregated below) is the single source of truth.
                                    addUnique(liveSellingHostNames, liveSellingHostName);
                                    addUnique(liveSellingEventSummaries, liveSellingEventSummary);

                                    // Reuses the same SOM export flag final_sale products use, so live selling items are excluded from returns the same way.
                                    lineItem.custom.somCC_returnable = false;
                                } catch(err) {
                                    dwLogger.warn('Missing ProductLineItem live selling custom attribute definition: ' + err);
                                }
                            }

                            var imageObject = new Object;

                            images(imageObject, product, { types: ['small','large'], quantity: 'single' });

                            var smallImage = imageObject.images['small'] && imageObject.images['small'][0];
                            var largeImage = imageObject.images['large'] && imageObject.images['large'][0];
                            var smallimageUrl = smallImage ? smallImage.absURL : '';
                            var largeimageUrl = largeImage ? buildStorefrontUrl(largeImage.absURL, largeImage.absURL) : '';

                            if (!empty(smallimageUrl)) {
                                lineItem.custom.Narvar_LOM__image_url = smallimageUrl;
                            }
                            if (!empty(largeimageUrl)) {
                                lineItem.custom.somCC_Image_URL = largeimageUrl;
                                lineItem.custom.rvw_autobahn__somCC_Image_URL = lineItem.custom.somCC_Image_URL;
                            }

                            var classification = product.classificationCategory;
                            if (!empty(classification)) {
                                lineItem.custom.somCC_classificationCategory = [classification.ID, '|', classification.displayName].join('');
                                lineItem.custom.rvw_autobahn__somCC_classificationCategory = lineItem.custom.somCC_classificationCategory
                            }

                            var primary = product.primaryCategory;
                            if (!empty(primary)) {
                                lineItem.custom.somCC_primaryCategory = [primary.ID, '|', primary.displayName].join('');
                                lineItem.custom.rvw_autobahn__somCC_primaryCategory = lineItem.custom.somCC_primaryCategory;
                            }

                            lineItem.custom.somCC_PDP_URL = buildStorefrontUrl(
                                URLUtils.url('Product-Show', 'pid', product.ID).toString(),
                                URLUtils.https('Product-Show', 'pid', product.ID).toString()
                            );
                            lineItem.custom.rvw_autobahn__somCC_PDP_URL = lineItem.custom.somCC_PDP_URL;
                            lineItem.custom.somCC_brandId = somOrderHelper.GetProductLineItemBrandId(lineItem);
                            lineItem.custom.rvw_autobahn__somCC_brandId = lineItem.custom.somCC_brandId;
                        }
                    } catch(err) {
                        dwLogger.warn('Missing ProductLineItem custom attribute definition: ' + err);
                    }
                });

                // Product & Shipping & Gift Cert Line items
                (productLineItems.length > 0 ? productLineItems.toArray() : []).concat(shippingLineItems.length > 0 ? shippingLineItems.toArray() : []).concat(giftCertificateItems.length > 0 ? giftCertificateItems.toArray() : [])
                .forEach(function(lineItem) {
                    try {
                        if (!empty(lineItem.UUID)) {
                            lineItem.custom.somCC_UUID = lineItem.UUID;
                            lineItem.custom.rvw_autobahn__somCC_UUID = lineItem.custom.somCC_UUID;
                        }
                    } catch(err) {
                        dwLogger.warn('Missing ProductLineItem custom attribute definition: ' + err);
                    }
                });
            });
            try {
                if (isLiveSellingOrder) {
                    order.custom.isLiveSellingOrder = true;
                    order.custom.liveSellingHostName = liveSellingHostNames.join(', ');
                    order.custom.liveSellingEventSummary = liveSellingEventSummaries.join(', ');
                }
                if (isCSCHandoffOrder) {
                    order.custom.isCSCHandoffOrder = true;
                }
            } catch(err) {
                dwLogger.warn('Missing Order live selling custom attribute definition: ' + err);
            }
            try {
                if (!empty(billingAddress.firstName)) {
                    order.custom.somCC_billingFirstName = billingAddress.firstName;
                    order.custom.rvw_autobahn__somCC_billingFirstName = order.custom.somCC_billingFirstName;
                }

                if (!empty(billingAddress.lastName)) {
                    order.custom.somCC_billingLastName = billingAddress.lastName;
                    order.custom.rvw_autobahn__somCC_billingLastName = order.custom.somCC_billingLastName;
                }

                if (!empty(order.paymentInstruments) && order.paymentInstruments.length > 0) {
                    order.paymentInstruments.toArray().forEach(function (paymentInstrument) {
                        // Set Null to empty string
                        var cardType = order.custom.somCC_paymentInstrumentCreditCardType || order.custom.rvw_autobahn__somCC_paymentInstrumentCreditCardType || '';

                        // Inject Delimiter if index > 0
                        cardType += cardType.length > 0 ? ',' : '';

                        // Add Payment Type Flag
                        cardType += (paymentInstrument && paymentInstrument.creditCardType) || '';

                        order.custom.somCC_paymentInstrumentCreditCardType = cardType;
                        order.custom.rvw_autobahn__somCC_paymentInstrumentCreditCardType = order.custom.somCC_paymentInstrumentCreditCardType;
                    });
                }
            } catch(err) {
                dwLogger.warn('Missing Order custom attribute definition: ' + err);
            }

            dwTransaction.commit();
            try {
                var cscOrderNotes = getCustomValue(order.custom, 'cscOrderNotes');
                var payload = {
                    order_id: order.orderNo,
                    event_id: order.UUID
                };
                if (!empty(cscOrderNotes)) {
                    payload.csc_order_notes = cscOrderNotes;
                }
                var response = orderEventService.call(payload);
                if (!response.ok) {
                    dwLogger.error('orderEventITPF failed for Order {0}: {1}', order.orderNo, response.errorMessage || 'Unknown error');
                } else {
                    dwLogger.info('orderEventITPF succeeded for Order {0}', order.orderNo);
                }
            } catch (e) {
                dwLogger.error('Exception in orderEventITPF for Order {0}: {1}', order.orderNo, e.message);
            }
            var pi = order.paymentInstruments[0];
            try {
                var zetaResponse=   zetaTrackEventService.call({
                            payload: {
                                activity: {
                                    subscriber: {
                                        uid: order.customerEmail || order.customer.profile.email
                                    },
                                    event: 'web_purchase',
                                    timestamp: new Date().toISOString(),
                                    properties: {
                            shoppingCartItems: order.getAllProductLineItems().toArray().map(function (pli) {
                                return {
                                    name: pli.productName,
                                    id: pli.productID,
                                    category: pli.product && pli.product.primaryCategory ? pli.product.primaryCategory.displayName: '',
                                    resourceType: 'product',
                                    price: pli.adjustedGrossPrice.value,
                                    quantity: pli.quantityValue,
                                    original_price: pli.basePrice.value,
                                    product_type: 'resale',
                                    brand: pli.product && pli.product.brand? pli.product.brand: '',
                                    subcategory: pli.product && pli.product.primaryCategory? pli.product.primaryCategory.displayName: '',
                                    condition: pli.product && pli.product.custom.condition_name? pli.product.custom.condition_name: '',
                                    material: pli.product && pli.product.custom.material? pli.product.custom.material: '',
                                    color_product: pli.product && pli.product.custom.color? pli.product.custom.color: '',
                                    location: pli.product && pli.product.custom.location? pli.product.custom.location: '',
                                    authenticity_loa: pli.product && pli.product.custom.authenticity_card? pli.product.custom.authenticity_card: false,
                                    product_discount: Math.max(0, pli.basePrice.value - pli.adjustedGrossPrice.value)
                                };
                            }),

                            total: order.totalGrossPrice.value,
                            promoCode: order.couponLineItems.length > 0 ? order.couponLineItems[0].couponCode: '',
                            CouponCode: order.couponLineItems.length > 0 ? order.couponLineItems[0].couponCode: '',
                            order_id: order.orderNo,
                            tax: order.totalTax.value,
                            shipping: order.shippingTotalPrice.value,
                            order_discount: order.getAdjustedMerchandizeTotalPrice(false).value - order.getAdjustedMerchandizeTotalPrice(true).value,
                            phone: order.billingAddress.phone || '',
                            shipping_method: shipments[0].shippingMethod ? shipments[0].shippingMethod.displayName : '',
                            payment_type: order.custom.Adyen_paymentMethod || '',
                            AccountID: order.customer && order.customer.profile ? order.customer.profile.customerNo : '',
                            FirstName: order.billingAddress.firstName || '',
                            PersonalEmail: order.customerEmail,
                            shipping_address: {
                                first_name: order.defaultShipment.shippingAddress.firstName || '',
                                last_name: order.defaultShipment.shippingAddress.lastName || '',
                                address1: order.defaultShipment.shippingAddress.address1 || '',
                                address2: order.defaultShipment.shippingAddress.address2 || '',
                                city: order.defaultShipment.shippingAddress.city || '',
                                state: order.defaultShipment.shippingAddress.stateCode || '',
                                postal_code: order.defaultShipment.shippingAddress.postalCode || '',
                                country: order.defaultShipment.shippingAddress.countryCode.value || ''
                            }
                        }
                                }
                            }
                        });
                        if (!zetaResponse || !zetaResponse.ok) {
                            dwLogger.error(
                                'Zeta failed for Order {0}: {1}',
                                order.orderNo,
                                zetaResponse
                                    ? zetaResponse.errorMessage
                                    : 'No response'
                            );
                        } else {
                            dwLogger.info(
                                'Zeta succeeded for Order {0}',
                                order.orderNo
                            );
                        }
            } catch (error) {
                dwLogger.error(
                    'Exception in Zeta for Order {0}: {1}',
                    order.orderNo,
                    error.message
                );
            }
        }
    }

    var baseReturn = base && base.doPrePlaceOrder ? base.doPrePlaceOrder.apply(base,arguments) : null;

    if (baseReturn && baseReturn.error === true) {
        return baseReturn;
    }

    return { error: false, message: '' };
}

module.exports = {
    doPrePlaceOrder: doPrePlaceOrder
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
