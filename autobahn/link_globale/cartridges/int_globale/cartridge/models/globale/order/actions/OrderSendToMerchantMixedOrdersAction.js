'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderSendToMerchantMixedOrdersAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderSendToMerchantMixedOrdersAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.basket = null;
    this.order = null;
    this.mainOrder = null;
    this.allOrdersSuccessfullyUpdated = true;
}

/* Inherits AbstractAction */
OrderSendToMerchantMixedOrdersAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Checks if the given order number is a system order number.
 * @param {string} orderNo - The order number to be checked
 * @return {boolean} Whether the order number is a system order number
 */
OrderSendToMerchantMixedOrdersAction.prototype.isGlobaleSystemOrderNumber = function (orderNo) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSystemOrderNumbers = [
        globaleHelpers.consts.orderNo.ORDER_CREATE_BYPASS_NO,
        globaleHelpers.consts.orderNo.ORDER_CREATE_FORCE_NEW_NO
    ];
    return globaleSystemOrderNumbers.indexOf(orderNo) !== -1;
};

/**
 * Process order
 * @param {Object} payload - Payload
 * @param {boolean} isSubOrder - The flag which identify that is processed sub order
 * @throws {Error}
 */
OrderSendToMerchantMixedOrdersAction.prototype.processOrder = function (payload, isSubOrder) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');
    var context = this;

    var order = null;
    var responseData = {
        errorCode: null,
        errorMessage: null,
        executionNotes: [],
        addExecutionNote: context.response.addExecutionNote,
        getExecutionNotes: context.response.getExecutionNotes
    };

    try {
        if (isSubOrder) {
            // modify payload and set 'MerchantOrderId' with the null value for sub orders (to exclude human's mistake)
            payload.MerchantOrderId = null; // eslint-disable-line no-param-reassign

            // validate payload
            this.request.validate({
                CurrencyCode: { required: true },
                MerchantOrderId: { required: true },
                OrderId: { required: true },
                UserId: { required: true },
                PrimaryBilling: { required: true },
                SecondaryBilling: { required: true },
                'PrimaryBilling.FirstName': { required: true },
                'PrimaryBilling.LastName': { required: true },
                'PrimaryBilling.CountryCode': { required: true },
                InternationalDetails: { required: true },
                'InternationalDetails.ShippingMethodCode': { required: true },
                'InternationalDetails.CurrencyCode': { required: true },
                DiscountedShippingPrice: { required: true },
                ShippingVATRate: { required: true },
                PrimaryShipping: { required: true },
                'PrimaryShipping.Email': { required: true },
                SecondaryShipping: { required: true },
                'SecondaryShipping.CountryCode': { required: true },
                'Customer.IsEndCustomerPrimary': { required: true },
                'Customer.EmailAddress': { required: true },
                Products: { required: true }, // @TODO implement empty/not empty validator and type validator, notNull
                Discounts: { required: true }
            }, payload);
            if (!this.request.validation.valid) {
                throw new Error('Invalid payload: ' + JSON.stringify(this.request.validation));
            }
        }

        var payloadSfccOrderNo = objectUtils.getValueByPath(payload, 'MerchantOrderId', null);
        var payloadGeOrderNo = objectUtils.getValueByPath(payload, 'OrderId', null);

        // ORDER_CREATE_BYPASS_NO should not be used in SOTM payload
        if (String(payloadSfccOrderNo) === globaleHelpers.consts.orderNo.ORDER_CREATE_BYPASS_NO) {
            responseData.errorCode = 500;
            responseData.errorMessage = 'Invalid payload MerchantOrderId is used: ' + payloadSfccOrderNo;
            throw new Error(responseData.errorMessage);
        }

        // search for order using SFCC order number (Order A)
        var orderMerchantNo = !this.isGlobaleSystemOrderNumber(payloadSfccOrderNo) ? OrderMgr.getOrder(payloadSfccOrderNo) : null;
        if (orderMerchantNo !== null) {
            responseData.addExecutionNote('Order found (SFCC No): ' + ['SFCC No: ' + orderMerchantNo.orderNo, 'GE No: ' + orderMerchantNo.custom[globaleHelpers.customAttr.order.geOrderNumber], 'Status: ' + orderMerchantNo.status.displayValue].join(';'));
        }

        // search for order using GE order number (Order B)
        var orderGeNo = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', payloadGeOrderNo);
        if (orderGeNo !== null) {
            responseData.addExecutionNote('Order found (GE No): ' + ['SFCC No: ' + orderGeNo.orderNo, 'GE No: ' + orderGeNo.custom[globaleHelpers.customAttr.order.geOrderNumber], 'Status: ' + orderGeNo.status.displayValue].join(';'));
            order = orderGeNo;
        }

        // create the order from a new basket if doesn't exist
        if (!order) {
            Transaction.begin();
            try {
                this.processDecoratorStatus(this.generateBasketFromPayload(payload), responseData);
                this.processDecoratorStatus(this.createOrder(payload.CurrencyCode, false), responseData);

                // set Global-e order number to have possibility to find order next time
                if (this.order) {
                    this.order.custom[globaleHelpers.customAttr.order.geOrderNumber] = payload.OrderId;
                }
                Transaction.commit();
            } catch (e) {
                Transaction.rollback();
                throw e;
            }
            order = this.order;
            this.writeNotes(order, 'GLOBALE_ORDER_CREATE');
        }

        if (!order) {
            responseData.errorCode = 301;
            responseData.errorMessage = 'The order does not exist';
            throw new Error(responseData.errorMessage);
        }

        // set reference to main order
        if (!isSubOrder) {
            this.mainOrder = order;
        }

        // check if order currency equals to payload currency
        if (order.currencyCode !== payload.CurrencyCode) {
            responseData.errorCode = 301;
            responseData.errorMessage = 'Order currency ' + order.currencyCode + ' doesn\'t match payload currency ' + payload.CurrencyCode;
            throw new Error(responseData.errorMessage);
        }

        Transaction.begin();
        try {
            if (!isSubOrder) {
                // set order type
                this.processDecoratorStatus(this.setOrderType(order, globaleHelpers.consts.typeMixedOrdersMainOrder), responseData);

                // set mixed order attributes
                this.processDecoratorStatus(this.setMixedOrdersSubOrderIDs(order, this.request.payload), responseData);
            } else {
                // set order type
                this.processDecoratorStatus(this.setOrderType(order, globaleHelpers.consts.typeMixedOrdersSubOrder), responseData);

                // set mixed order attributes
                this.processDecoratorStatus(this.setMixedOrdersMainOrderID(order, this.request.payload), responseData);
            }
            // set customer name
            this.processDecoratorStatus(this.setCustomerName(order, payload), responseData);

            // set customer id
            this.processDecoratorStatus(this.setCustomerId(order, payload), responseData);

            // set customer email
            this.processDecoratorStatus(this.setCustomerEmail(order, payload), responseData);

            // set ShipToStoreCode
            this.processDecoratorStatus(this.setDeliveryStore(order, payload), responseData);

            // set basic attributes
            this.processDecoratorStatus(this.setBasicAttributes(order, payload), responseData);

            // set replacement order attributes
            this.processDecoratorStatus(this.setReplacementOrderAttributes(order, payload), responseData);

            // set international attributes
            this.processDecoratorStatus(this.setInternationalAttributes(order, payload), responseData);

            // set address attributes
            this.processDecoratorStatus(this.setGeShippingAddressAttributes(order, payload), responseData);
            this.processDecoratorStatus(this.setCustomerShippingAddressAttributes(order, payload), responseData);
            this.processDecoratorStatus(this.setGeBillingAddressAttributes(order, payload), responseData);
            this.processDecoratorStatus(this.setCustomerBillingAddressAttributes(order, payload), responseData);

            // set loyalty
            this.processDecoratorStatus(this.setLoyalty(order, payload), responseData);

            // update order customer address
            this.processDecoratorStatus(this.updateOrderShippingAddress(order, payload), responseData);
            this.processDecoratorStatus(this.updateOrderBillingAddress(order, payload), responseData);

            // update customer address book
            if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccCreateNewAddressesFromCheckout, false, 'boolean')) {
                this.processDecoratorStatus(this.updateCustomerAddresses(order, payload), responseData);
            }

            // set customer comments
            this.processDecoratorStatus(this.setCustomerComments(order, payload), responseData);

            // update product line items
            this.processDecoratorStatus(this.updateProductLineItems(order, payload), responseData);

            // update price adjustments
            this.processDecoratorStatus(this.updatePriceAdjustments(order, payload), responseData);

            // update shipping method
            this.processDecoratorStatus(this.updateShippingMethod(order, payload), responseData);

            // set custom attributes data if the order is created from new generated SFCC basket
            if (order.custom[globaleHelpers.customAttr.order.geIsOrderCreatedFallbackScenario]) {
                this.processDecoratorStatus(this.setCustomAttributesData(order, payload), responseData);
            }

            // order place and confirm
            if (!geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccPlaceOrderOnPaymentUpdate, false, 'boolean')) {
                this.processDecoratorStatus(this.placeOrder(order), responseData);
                this.processDecoratorStatus(this.confirmOrder(order), responseData);
            }

            Transaction.commit();
        } catch (e) {
            order = null;
            Transaction.rollback();
            throw e;
        }

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterUpdateOrder, order, payload);

        // write notes
        this.writeNotes(order, 'GLOBALE_ORDER_CONFIRM');

        // response
        responseData.geOrderNumber = order.custom[globaleHelpers.customAttr.order.geOrderNumber];
        responseData.sfccOrderNumber = order.orderNo;
        if (!isSubOrder) {
            responseData.mainSuccess = true;
        } else {
            responseData.success = true;
        }
    } catch (e) {
        logger.error('GLOBALE_ORDER_SOTM_UPDATE: {0}', logger.message(e));
        this.allOrdersSuccessfullyUpdated = false;
        responseData.errorCode = responseData.errorCode || 100;
        responseData.errorMessage = responseData.errorMessage || (e.message + '; ' + e.stack);
    }

    // set response
    try {
        if (!isSubOrder) {
            this.response.setMainOrderData(order, responseData);
        } else {
            this.response.setSubOrderData(order, responseData);
        }
    } catch (e) {
        logger.error('GLOBALE_ORDER_SOTM_UPDATE: {0}', logger.message(e));
    }
};

/**
 * Update order
 * @throws {Error}
 */
OrderSendToMerchantMixedOrdersAction.prototype.run = function () {
    var ArrayList = require('dw/util/ArrayList');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    // process major order
    this.processOrder(this.request.payload);

    // process sub orders
    this.request.payload.Subs.forEach(function (orderPayload) {
        // process sub order
        this.processOrder(orderPayload, true);
    }.bind(this));

    // set successfully update flag
    this.setMixedOrdersSuccessfullyUpdatedFlag(this.mainOrder, this.allOrdersSuccessfullyUpdated);

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterUpdateMixedOrders, new ArrayList(this.response.data.orders), this.request.payload);
};

module.exports = OrderSendToMerchantMixedOrdersAction;
