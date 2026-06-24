'use strict';


/**
* Places SFCC Order (ORDER_STATUS_NEW)
* Push OMS + Zeta Event after successful order placement
*
* @param {dw.order.Order} order
* @returns {dw.system.Status}
*/
function placeOrder(order) {
   var Status = require('dw/system/Status');
   var Order = require('dw/order/Order');
   var OrderMgr = require('dw/order/OrderMgr');
   var Logger = require('dw/system/Logger');

   var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
   var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
   var zetaTrackEventService = require('*/cartridge/scripts/services/zetaTrackEventService');

   function getPaymentType(orderObj) {
       try {
           if (!orderObj.paymentInstruments ||orderObj.paymentInstruments.length === 0) {
               return '';
           }
           var pi = orderObj.paymentInstruments[0];
           if (pi.creditCardType) {
               return pi.creditCardType;
           }

           if (pi.paymentTransaction && pi.paymentTransaction.paymentMethod) {
               return pi.paymentTransaction.paymentMethod;
           }
           if (pi.paymentMethod) {
               return pi.paymentMethod;
           }

       } catch (e) {
           Logger.error('Payment Type Error: {0}', e.message);
       }


       return '';
   }

   function sendZetaEvent(orderObj) {
       try {
           var paymentType = getPaymentType(orderObj);
           var shoppingCartItems = orderObj.getAllProductLineItems().toArray().map(function (pli) {
                   return {
                       name: pli.productName,
                       id: pli.productID,
                       category: pli.product && pli.product.primaryCategory ? pli.product.primaryCategory.displayName : '',
                       resourceType: 'product',
                       price: pli.adjustedGrossPrice.value,
                       quantity: pli.quantityValue,
                       original_price: pli.basePrice.value,
                       product_type: 'resale',
                       brand: pli.product && pli.product.brand ? pli.product.brand : '',
                       subcategory: pli.product && pli.product.primaryCategory ? pli.product.primaryCategory.displayName : '',
                       condition: pli.product && pli.product.custom.condition_name ? pli.product.custom.condition_name : '',
                       material: pli.product && pli.product.custom.material ? pli.product.custom.material : '',
                       color_product: pli.product && pli.product.custom.color ? pli.product.custom.color : '',
                       location: pli.product && pli.product.custom.location ? pli.product.custom.location : '',
                       authenticity_loa: pli.product && pli.product.custom.authenticity_card ? pli.product.custom.authenticity_card : false,
                       product_discount: pli.basePrice.value - pli.adjustedGrossPrice.value
                   };
               });


           var payload = {
               payload: {
                   activity: {
                       subscriber: {
                           uid: orderObj.customerEmail || (orderObj.customer.profile ? orderObj.customer.profile.email : '')
                       },
                       event: 'web_purchase',
                       timestamp: new Date().toISOString(),
                       properties: {
                           shoppingCartItems: shoppingCartItems,
                           total: orderObj.totalGrossPrice.value,
                           promoCode: orderObj.couponLineItems.length > 0 ? orderObj.couponLineItems[0].couponCode : '',
                           CouponCode: orderObj.couponLineItems.length > 0 ? orderObj.couponLineItems[0].couponCode : '',
                           order_id: orderObj.orderNo,
                           tax: orderObj.totalTax.value,
                           shipping: orderObj.shippingTotalPrice.value,
                           order_discount: orderObj.getAdjustedMerchandizeTotalPrice(false).value -
                               orderObj.getAdjustedMerchandizeTotalPrice(true).value,
                           phone: orderObj.billingAddress.phone || '',
                           payment_type: paymentType,
                           AccountID: orderObj.customer && orderObj.customer.ID,
                           FirstName: orderObj.billingAddress.firstName || '',
                           PersonalEmail: orderObj.customerEmail || '',
                           shipping_address: {
                               first_name: orderObj.defaultShipment.shippingAddress.firstName || '',
                               last_name: orderObj.defaultShipment.shippingAddress.lastName || '',
                               address1: orderObj.defaultShipment.shippingAddress.address1 || '',
                               address2: orderObj.defaultShipment.shippingAddress.address2 || '',
                               city: orderObj.defaultShipment.shippingAddress.city || '',
                               state: orderObj.defaultShipment.shippingAddress.stateCode || '',
                               postal_code: orderObj.defaultShipment.shippingAddress.postalCode || '',
                               country: orderObj.defaultShipment.shippingAddress.countryCode.value || ''
                           }
                       }
                   }
               }
           };
           var response = zetaTrackEventService.call(payload);
           if (!response || !response.ok) {
               Logger.error(
                   'Zeta Failed for Order {0}: {1}',
                   orderObj.orderNo,
                   response ? response.errorMessage : 'No Response'
               );
           } else {
               Logger.info(
                   'Zeta Success for Order {0}',
                   orderObj.orderNo
               );
           }
       } catch (e) {
           Logger.error(
               'Zeta Exception for Order {0}: {1}',
               orderObj.orderNo,
               e.message
           );
       }
   }
    try {
        var orderStatus = order.getStatus();
        if (orderStatus.getValue() === Order.ORDER_STATUS_CREATED) {
            // invoke custom hook
            globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onBeforePlaceOrder, order, this.request.payload);

            var placeOrderResult = OrderMgr.placeOrder(order);
            if (placeOrderResult.isError()) {
                return new Status(Status.ERROR, '232', placeOrderResult.getMessage());
            }

            // invoke custom hook
            globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterPlaceOrder, order, this.request.payload);

            sendZetaEvent(order);
            this.addNote('Order placed successfully. OMS + Zeta processed.');

            return new Status(Status.OK);
        }

        if (orderStatus.getValue() === Order.ORDER_STATUS_FAILED) {
            return new Status(Status.ERROR, '232', 'Cannot place Order in status FAILED');
        } if (orderStatus.getValue() === Order.ORDER_STATUS_CANCELLED) {
            return new Status(Status.ERROR, '240', 'Cannot place Order in status CANCELLED');
        }

        this.addNote('Order has been already placed. Order status: ' + orderStatus.getDisplayValue());
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}


module.exports = function (object) {


   Object.defineProperty(object, 'placeOrder', {
       value: placeOrder
   });


};

