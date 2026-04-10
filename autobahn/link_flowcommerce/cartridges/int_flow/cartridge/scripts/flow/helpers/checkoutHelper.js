/* global empty:false */
'use strict';

var flowPriceTypeMap = {
    adjustment: 'flowAdjustmentPriceJson',
    subtotal: 'flowSubTotalPriceJson',
    vat: 'flowVatPriceJson',
    duty: 'flowDutyPriceJson',
    shipping: 'flowShippingPriceJson',
    insurance: 'flowInsurancePriceJson',
    discount: 'flowDiscountPriceJson',
    surcharges: 'flowSurchargesPriceJson'
};

/**
 * Adds a slash to the end of a url if needed
 * @param {string} url - URL
 * @returns {string} URL
 */
function addSlashifNeeded(url) {
    if (url.slice(-1) !== '/') {
        return url + '/';
    }
    return url;
}

/**
 * Assembles the SFCC basket from a Flow Order
 * @param {OrderModel} flowOrder - The Flow Order
 * @returns {Basket} SFCC Basket
 */
function assembleBasket(flowOrder) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var BasketHelper = require('*/cartridge/scripts/flow/helpers/basketHelper');

    var basket = null;

    try {
        basket = BasketHelper.assembleBasket(flowOrder);
    } catch (error) {
        FlowHelper.logger.error('checkoutHelper.js - Error recreating basket: ' + flowOrder.number + '. ' + error.toString());

        FlowHelper.createNotificationObject({
            flowOrderId: flowOrder.number,
            notification: 'checkoutHelper.js - Error recreating basket',
            data: error.toString()
        });
    }

    return basket;
}

/**
 * Creates the SFCC Order
 * @param {Basket} basket - The SFCC Basket
 * @param {string} orderNo - The order number
 * @returns {Order} SFCC Order
 */
function createOrder(basket, orderNo) {
    var StringUtils = require('dw/util/StringUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var order = null;

    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(basket, orderNo);
        });
    } catch (error) {
        FlowHelper.logger.error(StringUtils.format('CheckoutHelper.js - Unable to create SFCC Order for Flow Order {0} - {1} | {2}',
            orderNo,
            error.toString(),
            error.javaMessage ? error.javaMessage : '')
        );

        FlowHelper.createNotificationObject({
            flowOrderId: orderNo,
            notification: 'Unable to create SFCC Order for Flow Order',
            data: error.toString() + (error.javaMessage ? error.javaMessage : '')
        });
    }

    return order;
}

/**
 * Copies the Flow price information to SFCC
 * @param {dw.order.Order} order - SFCC Order
 * @param {OrderModel} flowOrder - Flow Order Model
 */
function setOrderFlowPrices(order, flowOrder) {
    /* eslint-disable no-param-reassign */
    if (flowOrder.prices && flowOrder.prices.length) {
        flowOrder.prices.forEach(function (price) {
            var key = flowPriceTypeMap[price.key];
            if (key) {
                order.custom[key] = JSON.stringify(price, null, 1);
            }
        });
    }

    order.custom.flowTotalPriceJson = JSON.stringify(flowOrder.total, null, 1);
    /* eslint-enable no-param-reassign */
}


/**
 * Copies the Flow allocation information to SFCC
 * @param {dw.order.Order} order - SFCC Order
 * @param {OrderAllocationModel} flowOrderAllocation - Flow Order Allocation Model
 */
function setOrderAllocations(order, flowOrderAllocation) {
    var collections = require('*/cartridge/scripts/util/collections');

    if (flowOrderAllocation) {
        collections.forEach(order.getProductLineItems(), function (lineItem) {
            var custom = lineItem.custom;

            // Get the allocations
            custom.flowAllocation = flowOrderAllocation.getItemAllocation(lineItem.productID);
            custom.flowCalculatedNetPrice = flowOrderAllocation.calculateFlowNetPrice(lineItem.productID);
        });
    }
}

/**
 * Prepares Flow Hosted Checkout
 * Creates a OrderFormModel
 * Creates the Flow Checkout with the OrderFormModel
 * Returns the Hosted Checkout Url
 * @returns {string} Flow Hosted Checkout Url or null
 */
function prepareHostedCheckout() {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var OrderFormModel = require('*/cartridge/scripts/flow/models/orderFormModel');

    var basket = BasketMgr.getCurrentBasket();
    var url;
    var oid;
    var confirmationUrl;
    var orderFormModel;
    var checkoutId;

    if (empty(basket)) {
        return null;
    }

    oid = OrderMgr.createOrderNo();
    confirmationUrl = URLUtils.https('Flow-ConfirmHostedCheckout', 'oid', oid).toString();
    orderFormModel = new OrderFormModel(basket, oid);

    checkoutId = flowApi.checkout.createCheckout(orderFormModel,
        FlowHelper.organizationId,
        ExperienceHelper.getCurrentExperience(),
        confirmationUrl
    );

    if (!checkoutId) {
        return null;
    }

    basket.startCheckout();

    url = addSlashifNeeded(FlowHelper.hostedCheckoutURL) +
        'checkouts/' +
        checkoutId +
        '/contact-info?flow_organization=' + FlowHelper.organizationId +
        '&flow_session_id=' + FlowHelper.sessionId;

    return url;
}

/**
 * Creates the SFCC Order
 * @param {string} orderNo - SFCC order sequence number
 * @returns {dw.order.Order} SFCC Order
 */
function createSFCCOrder(orderNo) {
    var Transaction = require('dw/system/Transaction');
    var StringUtils = require('dw/util/StringUtils');
    var Money = require('dw/value/Money');
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var flowOrder = flowApi.order.getOrder(orderNo);
    var flowOrderAllocation;
    var basket;
    var order;
    var experience;
    var balance;
    var total;
    var amountPaid;
    var paymentStatus;

    if (!flowOrder || !flowOrder.submitted_at) {
        // Flow Order was not retreived via the Flow API
        FlowHelper.logger.error(StringUtils.format('CheckoutHelper.js - Flow Order with identifier {0} not found.', orderNo));
        return null;
    }

    flowOrderAllocation = flowApi.order.getOrderAllocation(flowOrder.number);
    experience = ExperienceHelper.getExperience(flowOrder.experience.key, null, null);

    if (ExperienceHelper.useBaseCurrency(experience)) {
        ExperienceHelper.setExperience();
    } else {
        ExperienceHelper.setExperience(experience);
    }

    basket = assembleBasket(flowOrder);
    order = createOrder(basket, orderNo);

    if (order) {
        balance = new Money(FlowHelper.getFlowPriceAmount(flowOrder.balance), FlowHelper.getFlowPriceCurrency(flowOrder.balance));
        total = new Money(FlowHelper.getFlowPriceAmount(flowOrder.total), FlowHelper.getFlowPriceCurrency(flowOrder.total));
        amountPaid = total.subtract(balance);

        if (balance.value === 0) {
            paymentStatus = order.PAYMENT_STATUS_PAID;
        } else if (balance.value === total.value) {
            paymentStatus = order.PAYMENT_STATUS_NOTPAID;
        } else {
            paymentStatus = order.PAYMENT_STATUS_PARTPAID;
        }

        Transaction.wrap(function () {
            order.customerEmail = flowOrder.customer.email;
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
            setOrderFlowPrices(order, flowOrder);

            if (flowOrderAllocation) {
                setOrderAllocations(order, flowOrderAllocation);
            }

            order.setPaymentStatus(paymentStatus);
        });

        hooksHelper('flow.order.finalizeOrder', 'finalizeOrder', order, flowOrder, function () { return; });

        if (ExperienceHelper.useBaseCurrency(experience)) {
            ExperienceHelper.setExperience(experience);
        }
    } else if (experience && ExperienceHelper.useBaseCurrency(experience)) {
        ExperienceHelper.setExperience(experience);
    }

    return order;
}

/**
 * Checks the supplied skus for valid inventory
 * @param {string} body - The requeest body
 * @returns {Object} Inventory check result
 */
function inventoryCheck(body) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var payload;
    var skus = [];
    var result = null;

    if (body && FlowHelper.isFlowEnabled) {
        try {
            payload = JSON.parse(body);
        } catch (err) {
            FlowHelper.logger.error(err);
        }

        if (payload && payload.items && payload.items.length) {
            payload.items.forEach(function (obj) {
                var matches = skus.filter(function (sku) {
                    return sku.id === obj.id;
                });

                if (matches.length) {
                    matches[0].qty += obj.qty;
                } else {
                    skus.push(obj);
                }
            });
        }

        if (skus.length) {
            result = hooksHelper('flow.inventory.check', 'checkInventory', [skus], function (products) {
                var ProductMgr = require('dw/catalog/ProductMgr');

                return products.map(function (check) {
                    var product = ProductMgr.getProduct(check.id);
                    var availabilityModel = product ? product.getAvailabilityModel() : null;

                    return {
                        id: check.id,
                        has_inventory: availabilityModel !== null && availabilityModel.isInStock(check.qty)
                    };
                });
            });
        }
    }

    return result;
}

module.exports = {
    prepareHostedCheckout: prepareHostedCheckout,
    createSFCCOrder: createSFCCOrder,
    inventoryCheck: inventoryCheck,
    setOrderFlowPrices: setOrderFlowPrices,
    setOrderAllocations: setOrderAllocations,
    assembleBasket: assembleBasket
};
