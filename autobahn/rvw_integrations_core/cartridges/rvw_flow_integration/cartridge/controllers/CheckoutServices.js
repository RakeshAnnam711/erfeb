'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    // if there's no flow, flow on out of here
    if (!FlowHelper.isFlowEnabled) {
        return next();
    }

    // if order was not placed, skedaddle
    if (!res.viewData.orderID) {
        return next();
    }

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(res.viewData.orderID);

    // make sure the order number in the viewData actually maps to an order
    if (!order) {
        return next();
    }

    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var flowOrder = flowApi.order.getOrder(order.orderNo);

    // make sure a flow order exists
    if (!flowOrder || !flowOrder.submitted_at) {
        return next();
    }

    var Transaction = require('dw/system/Transaction');
    var balance = new dw.value.Money(FlowHelper.getFlowPriceAmount(flowOrder.balance), FlowHelper.getFlowPriceCurrency(flowOrder.balance));
    var total = new dw.value.Money(FlowHelper.getFlowPriceAmount(flowOrder.total), FlowHelper.getFlowPriceCurrency(flowOrder.total));
    var amountPaid = total.subtract(balance);
    var paymentStatus;

    // get proper payment status
    if (balance.value === 0) {
        paymentStatus = order.PAYMENT_STATUS_PAID;
    } else if (balance.value === total.value) {
        paymentStatus = order.PAYMENT_STATUS_NOTPAID;
    } else {
        paymentStatus = order.PAYMENT_STATUS_PARTPAID;
    }

    var flowCheckoutHelper = require('*/cartridge/scripts/flow/helpers/checkoutHelper');

    Transaction.wrap(function () {
        order.setCustomerEmail(flowOrder.customer.email);
        order.custom.flowOrderNumber = flowOrder.number;
        order.custom.flowFraudStatus = 'pending';
        order.custom.flowExperienceId = flowOrder.experience.key;
        order.custom.flowAmountPaid = amountPaid.value;
        order.custom.flowCurrency = amountPaid.currencyCode;

        if (flowOrder.attributes && flowOrder.attributes.gift_message) {
            order.custom.flowGiftMessage = flowOrder.attributes.gift_message;
        }

        if (flowOrder.attributes && flowOrder.attributes.sfcc_promotion_ids) {
            order.custom.flowPromotionIDs = flowOrder.attributes.sfcc_promotion_ids;
        }

        if (flowOrder.attributes && flowOrder.attributes.sfcc_coupons) {
            order.custom.flowCouponIDs = flowOrder.attributes.sfcc_coupons;
        }

        // Copies the raw Flow Order price data to the SFCC Order custom properties
        flowCheckoutHelper.setOrderFlowPrices(order, flowOrder);

        var flowOrderAllocation = flowApi.order.getOrderAllocation(flowOrder.number);

        if (flowOrderAllocation) {
            flowCheckoutHelper.setOrderAllocations(order, flowOrderAllocation);
        }

        order.setPaymentStatus(paymentStatus);
    });

    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    hooksHelper('flow.order.finalizeOrder', 'finalizeOrder', order, flowOrder, function () { return; });

    try {
        if (order.getCustomerEmail()) {
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            COHelpers.sendConfirmationEmail(order, req.locale.id);
        }
    } catch (e) {
        Transaction.wrap(function () {
            order.addNote('Failed sending order confirmation email: ', e.message);
        });
        dw.system.Logger.error('Failed sending order confirmation email: {0} - {1}', e.message, e.stack);
    }

    next();
});

module.exports = server.exports();
