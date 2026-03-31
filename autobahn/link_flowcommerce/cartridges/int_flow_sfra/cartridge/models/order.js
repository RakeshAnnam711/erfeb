/* global empty:false */
'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var base = module.superModule;

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getTotals(total) {
    return (!total || !total.available) ? '-' : formatMoney(total);
}

/**
 * Accepts a total object and formats the value
 * @param {string} flowJson - Flow money json as a string
 * @returns {dw.value.Money} The Money object
 */
function getFlowMoney(flowJson) {
    var object;

    try {
        object = JSON.parse(flowJson);
        return new Money(object.amount, object.currency);
    } catch (e) {
        return null;
    }
}

/**
 * @param {Object} order - SFCC Order Object
 * @returns {boolean} Indicates if Order is a Flow or System order
 */
function isFlowOrder(order) {
    return (order && 'flowOrderNumber' in order.custom && !empty(order.custom.flowOrderNumber));
}

/**
 * @param {Object} order - SFCC Order Object
 * @returns {Object} Flow Totals (Matches totals model)
 */
function createFlowTotals(order) {
    var flowOrderTax = (isFlowOrder(order) && !empty(order.custom.flowVatPriceJson))
        ? getTotals(getFlowMoney(order.custom.flowVatPriceJson)) : '-';

    var flowOrderDuty = (isFlowOrder(order) && !empty(order.custom.flowDutyPriceJson))
        ? getTotals(getFlowMoney(order.custom.flowDutyPriceJson)) : '-';

    var flowOrderShipping = (isFlowOrder(order) && !empty(order.custom.flowShippingPriceJson))
        ? getTotals(getFlowMoney(order.custom.flowShippingPriceJson)) : '-';

    var flowOrderSubTotal = (isFlowOrder(order) && !empty(order.custom.flowSubTotalPriceJson))
        ? getTotals(getFlowMoney(order.custom.flowSubTotalPriceJson)) : '-';

    var flowOrderTotal = (isFlowOrder(order) && !empty(order.custom.flowTotalPriceJson))
        ? getTotals(getFlowMoney(order.custom.flowTotalPriceJson)) : '-';

    var flowOrderDiscounts = (isFlowOrder(order) && !empty(order.custom.flowDiscountPriceJson)) ? {
        value: getFlowMoney(order.custom.flowDiscountPriceJson).value,
        formatted: getTotals(getFlowMoney(order.custom.flowDiscountPriceJson))
    } : {
        value: 0,
        formatted: '-'
    };

    return {
        subTotal: flowOrderSubTotal,
        grandTotal: flowOrderTotal,
        totalTax: flowOrderTax,
        totalDuty: flowOrderDuty,
        totalShippingCost: flowOrderShipping,
        orderLevelDiscountTotal: flowOrderDiscounts,
        shippingLevelDiscountTotal: '-',
        priceAdjustments: null
    };
}

// eslint-disable-next-line require-jsdoc
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    this.isFlowOrder = isFlowOrder(lineItemContainer);
    this.flowTotals = createFlowTotals(lineItemContainer);
}

OrderModel.prototype = Object.create(base.prototype);

module.exports = OrderModel;
