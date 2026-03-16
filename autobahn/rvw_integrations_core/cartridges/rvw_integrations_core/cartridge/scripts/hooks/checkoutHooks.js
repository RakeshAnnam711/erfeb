'use strict';

// API Includes
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');



/**
 * Creates an order and send it across to AvaTax service to be recorded.
 * @returns {string} order number
 */
 exports.createOrderNo = function () {
    var orderNo = null;

    if(Site.current.getCustomPreferenceValue('paypalCartridgeEnabled')) {
        orderNo = session.privacy.paypalUsedOrderNo;
        let isOrderExist;

        if (!orderNo) {
            orderNo = OrderMgr.createOrderSequenceNo();
            session.privacy.paypalUsedOrderNo = orderNo;
        } else {
            try {
                isOrderExist = !empty(OrderMgr.getOrder(orderNo));
                if (isOrderExist) {
                    orderNo = OrderMgr.createOrderSequenceNo();
                    session.privacy.paypalUsedOrderNo = orderNo;
                }
            } catch (error) {
                var Logger = require('dw/system/Logger');
                paypalLogger = paypalLogger || Logger.getLogger('PayPal', 'PayPal_General');
                paypalLogger.error(error.stack ? (error.message + error.stack) : error);

                orderNo = OrderMgr.createOrderSequenceNo();
                session.privacy.paypalUsedOrderNo = orderNo;
            }
        }
    }

    if (Site.current.getCustomPreferenceValue('avataxCartridgeEnabled')) {
        try {
            var AvaTax = require('*/cartridge/scripts/avaTax');
            var basket = BasketMgr.currentBasket;
            orderNo = orderNo || OrderMgr.createOrderSequenceNo();

            AvaTax.calculateTax(basket, orderNo);

            // Calculate the basket
            Transaction.wrap(function () {
                var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
                basketCalculationHelpers.calculateTotals(basket);
            });
        } catch (e) {
            var LOGGER = require('dw/system/Logger').getLogger('Avalara', 'AvaTax');
            LOGGER.warn('Error while generating order no. File - avataxhooks.js | ' + e.message);
            if (!empty(e.javaName) && e.javaName == 'CreateException') {
                throw e;
            }
        }
    }

    if (orderNo) {
        return orderNo;
    }
};
