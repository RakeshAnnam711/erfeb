'use strict';

var Logger = require('dw/system/Logger');

function sendOrderDetailsToSFMC(order) {
    var SFMCAPIHelper = require('*/cartridge/scripts/services/SFMCAPIService');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var email = order.orderEmail;
    var accessToken = SFMCAPIHelper.fetchAccessToken();
    var brandArray = SFMCAPIHelper.getBrandList();
    if (accessToken) {
        // Use the access token for subsequent API calls
        // dw.system.Logger.info('Access token: ' + accessToken);
        for (var i = 0; i < order.items.items.length; i++) {
            var shippingAddress = order.shipping[0].shippingAddress;
            var paymentName = order.billing.payment.selectedPaymentInstruments[0].name;
            var priceAdjustments = '';
            if (order.totals.discounts && Array.isArray(order.totals.discounts) && order.totals.discounts.length > 0) {
                priceAdjustments = order.totals.discounts[0].couponCode;
            }
            var product = ProductMgr.getProduct(order.items.items[i].id);
            if (brandArray.length === 0 || brandArray.includes(product.brand.toLowerCase())) {
                var eventData = {
                    ContactKey: email,
                    EventDefinitionKey: SFMCAPIHelper.getOrderEventDefinitionKey(),
                    Data: {
                        Email_Address: email,
                        Phone_Number: shippingAddress.phone,
                        First_Name: order.billing.billingAddress.address.firstName,
                        Last_Name: order.billing.billingAddress.address.lastName,
                        Address: shippingAddress.city + ' ' + shippingAddress.postalCode + ' ' + shippingAddress.countryCode.value,
                        Product: order.items.items[i].id,
                        Payment_Method: paymentName,
                        Offer_Code_Used: priceAdjustments,
                        Qyantity: order.items.items[i].quantity,
                        Brand: product.brand,
                    }
                };
                Logger.error('Interaction event response order: ' + JSON.stringify(eventData));
                // Trigger the interaction event
                var response = SFMCAPIHelper.triggerInteractionEvent(accessToken, eventData);
                Logger.error('Interaction event response: ' + JSON.stringify(response));
                if (response) {
                    if (response.eventInstanceId) {
                        Logger.info('Interaction event triggered successfully. Event Instance ID: ' + response.eventInstanceId);
                    } else {
                        Logger.error('Interaction event response received but no eventInstanceId found: ' + JSON.stringify(response));
                    }
                } else {
                    Logger.error('Failed to trigger interaction event.' + JSON.stringify(response));
                }
            }
        }

    } else {
        Logger.error('Failed to retrieve access token.');
    }
}

module.exports = {
    sendOrderDetailsToSFMC: sendOrderDetailsToSFMC
};