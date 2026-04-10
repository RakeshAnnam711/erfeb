
var base = module.superModule || {};

var URLUtils = require('dw/web/URLUtils');

var dwLogger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');
var images = require('*/cartridge/models/product/decorators/images');

/**
 * Allows an override for integrations to implement logic after an order is placed.
 * @param {dw.order.Order} order - The order object to be placed
 */
function doPrePlaceOrder(order) {
    if (!empty(order)) {
        var dwTransaction = require('dw/system/Transaction');
        var somOrderHelper = require('*/cartridge/scripts/checkout/SomOrderHelper');
        var orderEventService = require('*/cartridge/scripts/services/orderEventITPFservice');
        var shipments = order.getShipments();
        var billingAddress = order.getBillingAddress();
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

                        if (!empty(product)) {
                            var imageObject = new Object;

                            images(imageObject, product, { types: ['small','large'], quantity: 'single' });

                            var smallimageUrl = imageObject.images['small'][0].absURL;
                            var largeimageUrl = imageObject.images['large'][0].absURL;

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

                            lineItem.custom.somCC_PDP_URL = URLUtils.https('Product-Show', 'pid', product.ID).toString();
                            lineItem.custom.rvw_autobahn__somCC_PDP_URL = lineItem.custom.somCC_PDP_URL.custom.somCC_PDP_URL;
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
                var payload = {
                    order_id: order.orderNo,
                    event_id: order.UUID
                };
    
                var response = orderEventService.call(payload);
    
                if (!response.ok) {
                    dwLogger.error('orderEventITPF failed for Order {0}: {1}', order.orderNo, response.errorMessage || 'Unknown error');
                } else {
                    dwLogger.info('orderEventITPF succeeded for Order {0}', order.orderNo);
                }
            } catch (e) {
                dwLogger.error('Exception in orderEventITPF for Order {0}: {1}', order.orderNo, e.message);
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
