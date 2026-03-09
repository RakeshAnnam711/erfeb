'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderSendToMerchantAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderSendToMerchantAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.basket = null;
    this.order = null;
}

/* Inherits AbstractAction */
OrderSendToMerchantAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Checks if the given order number is a system order number.
 * @param {string} orderNo - The order number to be checked
 * @return {boolean} Whether the order number is a system order number
 */
OrderSendToMerchantAction.prototype.isGlobaleSystemOrderNumber = function (orderNo) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSystemOrderNumbers = [
        globaleHelpers.consts.orderNo.ORDER_CREATE_BYPASS_NO,
        globaleHelpers.consts.orderNo.ORDER_CREATE_FORCE_NEW_NO
    ];
    return globaleSystemOrderNumbers.indexOf(orderNo) !== -1;
};

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderSendToMerchantAction.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    var order = null;
    var payloadSfccOrderNo = objectUtils.getValueByPath(this.request.payload, 'MerchantOrderId', null);
    var payloadGeOrderNo = objectUtils.getValueByPath(this.request.payload, 'OrderId', null);

    // ORDER_CREATE_BYPASS_NO should not be used in SOTM payload
    if (String(payloadSfccOrderNo) === globaleHelpers.consts.orderNo.ORDER_CREATE_BYPASS_NO) {
        this.response.errorCode = 500;
        this.response.errorMessage = 'Invalid payload MerchantOrderId is used: ' + payloadSfccOrderNo;
        throw new Error(this.response.errorMessage);
    }

    // ORDER_CREATE_FORCE_NEW_NO is used
    if (String(payloadSfccOrderNo) === globaleHelpers.consts.orderNo.ORDER_CREATE_FORCE_NEW_NO) {
        this.response.addExecutionNote('System Reserved Order No used');
        var cartId = objectUtils.getValueByPath(this.request.payload, 'CartId', null);
        var orderBasketUuid = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geCartId + ' = {0}', cartId);

        if (orderBasketUuid !== null) {
            this.response.addExecutionNote('Order found (Basket UUID): ' + ['SFCC No: ' + orderBasketUuid.orderNo, 'GE No: ' + orderBasketUuid.custom[globaleHelpers.customAttr.order.geOrderNumber], 'Status: ' + orderBasketUuid.status.displayValue].join(';'));
            this.response.addExecutionNote('WARNING: Potential order colision: another order with the same basket UUID exists');
        }
    }

    // search for order using SFCC order number (Order A)
    var orderMerchantNo = !this.isGlobaleSystemOrderNumber(payloadSfccOrderNo) ? OrderMgr.getOrder(payloadSfccOrderNo) : null;
    if (orderMerchantNo !== null) {
        this.response.addExecutionNote('Order found (SFCC No): ' + ['SFCC No: ' + orderMerchantNo.orderNo, 'GE No: ' + orderMerchantNo.custom[globaleHelpers.customAttr.order.geOrderNumber], 'Status: ' + orderMerchantNo.status.displayValue].join(';'));
        order = orderMerchantNo;
    }

    // check if order was updated before and GE order number matches the payload value
    if (
        orderMerchantNo
        && orderMerchantNo.status.value !== Order.ORDER_STATUS_CREATED
        && orderMerchantNo.custom[globaleHelpers.customAttr.order.geOrderNumber]
        && orderMerchantNo.custom[globaleHelpers.customAttr.order.geOrderNumber] !== payloadGeOrderNo
    ) {
        this.response.errorCode = 501;
        this.response.errorMessage = 'Order colision: order with the same SFCC number and different GE number exists';
        throw new Error(this.response.errorMessage);
    }

    // search for order using GE order number (Order B)
    var orderGeNo = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', payloadGeOrderNo);
    if (orderGeNo !== null) {
        this.response.addExecutionNote('Order found (GE No): ' + ['SFCC No: ' + orderGeNo.orderNo, 'GE No: ' + orderGeNo.custom[globaleHelpers.customAttr.order.geOrderNumber], 'Status: ' + orderGeNo.status.displayValue].join(';'));
    }

    // check if Order A doesn't exist but Order B exists (shouldn't happen)
    if (!orderMerchantNo && orderGeNo) {
        this.response.errorCode = 501;
        this.response.errorMessage = 'Order colision: order with the same GE order number already exists';
        throw new Error(this.response.errorMessage);
    }

    // check if both Order A and Order B reffer to the same SFCC order
    if (orderMerchantNo && orderGeNo && orderMerchantNo.orderNo !== orderGeNo.orderNo) {
        this.response.errorCode = 501;
        this.response.errorMessage = 'Order colision: order with the same GE order number already exists';
        throw new Error(this.response.errorMessage);
    }

    // create order using new basket if it doesn't exist
    if (!order) {
        Transaction.begin();
        try {
            this.processDecoratorStatus(this.generateBasketFromPayload(this.request.payload), this.response);
            this.processDecoratorStatus(this.createOrder(this.request.payload.CurrencyCode, false), this.response);
            Transaction.commit();
        } catch (e) {
            Transaction.rollback();
            throw e;
        }
        order = this.order;
        this.writeNotes(order, 'GLOBALE_ORDER_CREATE');
    }

    // check if order was created
    if (!order) {
        this.response.errorCode = 500;
        this.response.errorMessage = 'The order does not exist';
        throw new Error(this.response.errorMessage);
    }

    // check if order currency equals to payload currency
    if (order.currencyCode !== this.request.payload.CurrencyCode) {
        this.response.errorCode = 500;
        this.response.errorMessage = 'Order currency ' + order.currencyCode + ' doesn\'t match payload currency ' + this.request.payload.CurrencyCode;
        throw new Error(this.response.errorMessage);
    }

    Transaction.begin();
    try {
        // set order type
        this.processDecoratorStatus(this.setOrderType(order, globaleHelpers.consts.typeSingleOrder), this.response);

        // set customer name
        this.processDecoratorStatus(this.setCustomerName(order, this.request.payload), this.response);

        // set customer id
        this.processDecoratorStatus(this.setCustomerId(order, this.request.payload), this.response);

        // set customer email
        this.processDecoratorStatus(this.setCustomerEmail(order, this.request.payload), this.response);

        // set ShipToStoreCode
        this.processDecoratorStatus(this.setDeliveryStore(order, this.request.payload), this.response);

        // set basic attributes
        this.processDecoratorStatus(this.setBasicAttributes(order, this.request.payload), this.response);

        // set replacement order attributes
        this.processDecoratorStatus(this.setReplacementOrderAttributes(order, this.request.payload), this.response);

        // set international attributes
        this.processDecoratorStatus(this.setInternationalAttributes(order, this.request.payload), this.response);

        // set address attributes
        this.processDecoratorStatus(this.setGeShippingAddressAttributes(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.setCustomerShippingAddressAttributes(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.setGeBillingAddressAttributes(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.setCustomerBillingAddressAttributes(order, this.request.payload), this.response);

        // set loyalty
        this.processDecoratorStatus(this.setLoyalty(order, this.request.payload), this.response);

        // update order customer address
        this.processDecoratorStatus(this.updateOrderShippingAddress(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.updateOrderBillingAddress(order, this.request.payload), this.response);

        // update customer address book
        if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccCreateNewAddressesFromCheckout, false, 'boolean')) {
            this.processDecoratorStatus(this.updateCustomerAddresses(order, this.request.payload), this.response);
        }

        // set customer comments
        this.processDecoratorStatus(this.setCustomerComments(order, this.request.payload), this.response);

        // update product line items
        this.processDecoratorStatus(this.updateProductLineItems(order, this.request.payload), this.response);

        // update price adjustments
        this.processDecoratorStatus(this.updatePriceAdjustments(order, this.request.payload), this.response);

        // update shipping method
        this.processDecoratorStatus(this.updateShippingMethod(order, this.request.payload), this.response);

        // set custom attributes data if the order is created from new generated SFCC basket
        if (order.custom[globaleHelpers.customAttr.order.geIsOrderCreatedFallbackScenario]) {
            this.processDecoratorStatus(this.setCustomAttributesData(order, this.request.payload), this.response);
        }

        // order place and confirm
        if (!geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccPlaceOrderOnPaymentUpdate, false, 'boolean')) {
            this.processDecoratorStatus(this.placeOrder(order), this.response);
            this.processDecoratorStatus(this.confirmOrder(order), this.response);
        }

        Transaction.commit();
    } catch (e) {
        order = null;
        Transaction.rollback();
        throw e;
    }

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterUpdateOrder, order, this.request.payload);

    // write notes
    this.writeNotes(order, 'GLOBALE_ORDER_CONFIRM');

    this.response.data.orders.push(order);
    this.response.sfccOrderNumber = order.orderNo;
    this.response.success = true;
};

module.exports = OrderSendToMerchantAction;
