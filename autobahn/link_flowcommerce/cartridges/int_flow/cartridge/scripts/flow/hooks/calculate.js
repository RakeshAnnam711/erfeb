'use strict';

var Status = require('dw/system/Status');

/**
 * Check to see if this experience should use the base currency
 * @param {string} key - Experience Key
 * @returns {boolean} Use Base Currency flag
 */
function getUseBaseCurrency(key) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var experience = ExperienceHelper.getExperience(key, null, null);
    return ExperienceHelper.useBaseCurrency(experience);
}

/**
 * Makes sure all product line items have a price set (Sets to zero if N/A)
 * @param {dw.order.Basket} basket - Customer Basket
 * @returns {dw.system.Status} OK Status Code
 */
function calculatePrices(basket) {
    var collections = require('*/cartridge/scripts/util/collections');

    collections.forEach(basket.allProductLineItems, function (item) {
        var product = item.product;

        if (item.optionProductLineItem && !item.bonusProductLineItem) {
            item.updateOptionPrice();
        } else if (product === null) {
            item.setPriceValue(null);
        } else if (item.bundledProductLineItem || !item.getPrice().isAvailable()) {
            item.setPriceValue(0);
        }
    });

    return new Status(Status.OK);
}

/**
 * Gets the Shipping cost from the Flow API and assigns to the Basket
 * @param {dw.order.Basket} basket - Customer Basket
 * @param {OrderModel} flowOrder - Flow Order
 * @returns {dw.system.Status} OK Status Code
 */
function calculateShipping(basket, flowOrder) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var collections = require('*/cartridge/scripts/util/collections');

    var selections = flowOrder.selections || [];
    var useBaseCurrency = getUseBaseCurrency(flowOrder.experience.key);

    collections.forEach(basket.allProductLineItems, function (item) {
        item.removeShippingLineItem();
    });

    flowOrder.deliveries.forEach(function (delivery) {
        var selectedOption;
        var cost;
        var sli;

        var shipment = collections.find(basket.getShipments(), function (s) {
            return s.custom.flowDeliveryId === delivery.id;
        });

        if (shipment) {
            collections.forEach(shipment.shippingLineItems, function (li) {
                shipment.removeShippingLineItem(li);
            });

            selectedOption = delivery.options.filter(function (option) {
                return selections.indexOf(option.id) > -1;
            });

            if (selectedOption) {
                cost = FlowHelper.getFlowPriceAmount(selectedOption[0].price, useBaseCurrency);

                sli = shipment.createShippingLineItem('FLOW_SHIPPING');
                sli.setPriceValue(cost);
            }
        }
    });

    return new Status(Status.OK);
}

/**
 * Gets the Tax cost from the Flow API and assigns to the Basket
 * @param {dw.order.Basket} basket - Customer Basket
 * @param {OrderModel} flowOrder - Flow Order
 * @returns {dw.system.Status} OK Status Code
 */
function calculateTax(basket, flowOrder) {
    var Money = require('dw/value/Money');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var collections = require('*/cartridge/scripts/util/collections');

    var useBaseCurrency = getUseBaseCurrency(flowOrder.experience.key);
    var flowTotals = flowOrder.prices;
    var zeroMoney = new Money(0, FlowHelper.getFlowPriceCurrency(flowOrder.total, useBaseCurrency));
    var taxMoney = new Money(0, zeroMoney.currencyCode);
    var defaultShipment = basket.getDefaultShipment();

    if (flowTotals && flowTotals.length > 0) {
        flowTotals.forEach(function (price) {
            if (['duty', 'vat', 'insurance', 'surcharges'].indexOf(price.key) > -1) {
                taxMoney = taxMoney.add(new Money(FlowHelper.getFlowPriceAmount(price, useBaseCurrency), taxMoney.currencyCode));
            }
        });

        collections.forEach(basket.allLineItems, function (lineItem) {
            lineItem.updateTaxAmount(zeroMoney);
        });

        defaultShipment.shippingLineItems[0].updateTaxAmount(taxMoney);
    }

    return new Status(Status.OK);
}

/**
 * Calculates item and order discounts
 * @param {dw.order.Basket} basket - Customer Basket
 * @param {OrderModel} flowOrder - Flow Order
 * @returns {dw.system.Status} OK Status Code
 */
function calculateDiscounts(basket, flowOrder) {
    var Money = require('dw/value/Money');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var collections = require('*/cartridge/scripts/util/collections');

    var useBaseCurrency = getUseBaseCurrency(flowOrder.experience.key);
    var flowTotals = flowOrder.prices;
    var cost;
    var pa;
    var discount;
    var orderDiscount;
    var i;

    // Calculate item discounts
    collections.forEach(basket.allProductLineItems, function (li) {
        var item = flowOrder.getItem(li.productID);
        var custom = li.custom;

        if (item && item.discount) {
            pa = li.createPriceAdjustment('FLOW_LINE_ITEM_DISCOUNT');

            cost = FlowHelper.getFlowPriceAmount(item.discount, useBaseCurrency);
            pa.setPriceValue(cost);

            if (item.attributes && item.attributes.sfcc_promotion_ids) {
                custom.flowPromotionIDs = item.attributes.sfcc_promotion_ids;
            }
        }
    });

    // Calculate order discounts
    if (flowTotals && flowTotals.length > 0) {
        for (i = 0; i < flowTotals.length; i++) {
            if (flowTotals[i].key === 'discount') {
                discount = flowTotals[i];
                break;
            }
        }
    }

    if (discount && discount.components && discount.components.length) {
        discount.components.forEach(function (component) {
            var amount = FlowHelper.getFlowPriceAmount(component, useBaseCurrency);
            var currency = FlowHelper.getFlowPriceCurrency(component, useBaseCurrency);

            if (component.key === 'order_discount') {
                orderDiscount = orderDiscount ? orderDiscount.add(new Money(amount, currency)) : new Money(amount, currency);
            }
        });
    }

    if (orderDiscount) {
        pa = basket.createPriceAdjustment('FLOW_ORDER_DISCOUNT');
        pa.setPriceValue(orderDiscount.getValue());
    }

    return new Status(Status.OK);
}

/**
 * Calculates the Tax & Shipping on the Basket via the Flow API.
 * Updates the Basket totals
 * @param {dw.order.Basket} basket - Customer Basket
 * @param {OrderModel} flowOrder - Flow Order
 * @returns {dw.system.Status} OK Status Code
 */
function calculate(basket, flowOrder) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    hooksHelper('flow.order.calculateProductPrices', 'calculateProductPrices', basket, flowOrder, calculatePrices);
    hooksHelper('flow.order.calculateShipping', 'calculateShipping', basket, flowOrder, calculateShipping);
    hooksHelper('flow.order.calculateDiscounts', 'calculateDiscounts', basket, flowOrder, calculateDiscounts);
    hooksHelper('flow.order.calculateTax', 'calculateTax', basket, flowOrder, calculateTax);

    basket.updateTotals();

    return new Status(Status.OK);
}

module.exports = {
    calculate: calculate
};
