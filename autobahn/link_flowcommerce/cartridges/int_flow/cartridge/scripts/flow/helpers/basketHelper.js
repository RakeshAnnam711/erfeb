/* global empty:false */
'use strict';

/**
 * Removes all gift certificate items from a basket
 * @param {dw.order.Basket} basket - Current customer Basket
 */
function removeBasketGiftCertificates(basket) {
    var itemRemovalList = basket.getGiftCertificateLineItems().toArray();
    var i;

    for (i = 0; i < itemRemovalList.length; i++) {
        basket.removeGiftCertificateLineItem(itemRemovalList[i]);
    }
}

/**
 * Removes all coupon line items from a basket
 * @param {dw.order.Basket} basket - Current customer Basket
 */
function removeBasketCoupons(basket) {
    var itemRemovalList = basket.getCouponLineItems().toArray();
    var i;

    for (i = 0; i < itemRemovalList.length; i++) {
        basket.removeCouponLineItem(itemRemovalList[i]);
    }
}

/**
 * Removes all product line items from a basket
 * @param {dw.order.Basket} basket - Current customer Basket
 */
function removeBasketProducts(basket) {
    var itemRemovalList = basket.getAllProductLineItems().toArray();
    var i;

    for (i = 0; i < itemRemovalList.length; i++) {
        basket.removeProductLineItem(itemRemovalList[i]);
    }
}

/**
 * Removes all shipments from a basket
 * @param {dw.order.Basket} basket - Current customer Basket
 */
function removeBasketShipments(basket) {
    var collections = require('*/cartridge/scripts/util/collections');

    var itemRemovalList = [];
    var i;

    collections.forEach(basket.getShipments(), function (shipment) {
        if (!shipment.default) {
            itemRemovalList.push(shipment);
        }
    });

    for (i = 0; i < itemRemovalList.length; i++) {
        basket.removeShipment(itemRemovalList[i]);
    }
}

/**
 * Clears a Basket
 * @param {dw.order.Basket} basket - Current customer Basket
 */
function clearBasket(basket) {
    var BasketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    basket.removeAllPaymentInstruments();
    removeBasketCoupons(basket);
    removeBasketGiftCertificates(basket);
    removeBasketProducts(basket);
    removeBasketShipments(basket);

    // Recalculate Empty Basket
    BasketCalculationHelpers.calculateTotals(basket);
}

/**
 * Gets the current Customer Basket and compares against an optional UUID
 * @param {string} uuid - Basket UUID
 * @returns {dw.order.Basket} Basket or null
 */
function getBasket(uuid) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentOrNewBasket();

    if (uuid && basket.UUID !== uuid) {
        basket = null;
    }

    return basket;
}

/**
 * Creates a Shipment and Product Line Items for a Basket
 * @param {string} experienceId - Flow Experience If
 * @param {dw.order.Basket} basket - Current Basket
 * @param {Object} delivery - Flow Delivery Object
 * @param {Array} selections - Flow Selections Array
 * @param {boolean} first - Flag to indicate if this is the first Delivery Object
 * @returns {dw.order.Shipment} Shipment
 */
function createShipment(experienceId, basket, delivery, selections, first) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var collections = require('*/cartridge/scripts/util/collections');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var shippingMethods = ShippingMgr.getAllShippingMethods();
    var shipment = first ? basket.getDefaultShipment() : basket.createShipment(delivery.id);
    var experience = ExperienceHelper.getExperience(experienceId, null, null);
    var useBaseCurrency = ExperienceHelper.useBaseCurrency(experience);

    // The selected shipping method from the Flow Hosted Checkout
    var selectedOption = delivery.options.filter(function (option) {
        return selections.indexOf(option.id) > -1;
    });

    var shippingMethod = collections.find(shippingMethods, function (method) {
        var methodIdPrefix = selectedOption[0].tier.id + '-';
        return method.ID === (useBaseCurrency ? methodIdPrefix + FlowHelper.defaultCurrencyCode : methodIdPrefix + experience.currencyCode);
    });

    delivery.items.forEach(function (item) {
        var lineItem = basket.createProductLineItem(item.number, shipment);
        lineItem.setQuantityValue(item.quantity);
        lineItem.setPriceValue(FlowHelper.getFlowPriceAmount(item.price, useBaseCurrency));
        lineItem.custom.flowPrice = JSON.stringify(item.price, null, 1);
    });

    shipment.custom.flowDeliveryId = delivery.id;

    if (shippingMethod) {
        shipment.setShippingMethod(shippingMethod);
    } else {
        hooksHelper('flow.shipment.addShippingMethod', 'addShippingMethod', shipment, delivery, selectedOption[0], experienceId, function () { return; });
    }

    return shipment;
}

/**
 * Copies a Flow Destination to a SFCC Shipment Address
 * @param {dw.order.Shipment} shipment - Shipment
 * @param {Object} flowDestination - Flow Order destination
 */
function populateShipmentAddress(shipment, flowDestination) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var orderAddress = shipment.createShippingAddress();

    orderAddress.address1 = flowDestination.streets[0];
    orderAddress.address2 = flowDestination.streets[1] || null;
    orderAddress.city = flowDestination.city;
    orderAddress.companyName = flowDestination.contact.company || '';
    orderAddress.countryCode = ExperienceHelper.convertCountryCode(flowDestination.country);
    orderAddress.firstName = flowDestination.contact.name.first || '';
    orderAddress.lastName = flowDestination.contact.name.last || '';
    orderAddress.postalCode = flowDestination.postal;
    orderAddress.phone = flowDestination.contact.phone || '';
    orderAddress.stateCode = flowDestination.province || '';
}

/**
 * Copies a Flow payment Address to a SFCC Order billing Address
 * @param {dw.order.Basket} basket - Basket
 * @param {Object} flowAddress - Flow Order payment address
 */
function populateBillingAddress(basket, flowAddress, phone) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var orderAddress = basket.createBillingAddress();

    orderAddress.address1 = flowAddress.streets[0];
    orderAddress.address2 = flowAddress.streets[1] || null;
    orderAddress.city = flowAddress.city;
    orderAddress.companyName = flowAddress.company || '';
    orderAddress.countryCode = ExperienceHelper.convertCountryCode(flowAddress.country);
    orderAddress.firstName = flowAddress.name ? (flowAddress.name.first || '') : '';
    orderAddress.lastName = flowAddress.name ? (flowAddress.name.last || '') : '';
    orderAddress.postalCode = flowAddress.postal;
    orderAddress.stateCode = flowAddress.province || '';
    orderAddress.phone = phone;
}

/**
 * Maps a Flow Destination object to a Flow Billing Address object
 * @param {Object} flowDestination - Flow Destination
 * @returns {Object} Flow Billing address
 */
function mapFlowDestinationToPaymentAddress(flowDestination) {
    return {
        streets: flowDestination.streets,
        city: flowDestination.city,
        country: flowDestination.country,
        name: flowDestination.contact.name,
        postal: flowDestination.postal,
        province: flowDestination.province,
        company: flowDestination.contact.company
    };
}

/**
 * Recreates the Basket from the Flow Order
 * @param {OrderModel} flowOrder - Flow OrderModel
 * @returns {dw.order.Basket} Basket or null
 */
function assembleBasket(flowOrder) {
    var Money = require('dw/value/Money');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Transaction = require('dw/system/Transaction');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var flowCalculate = require('*/cartridge/scripts/flow/hooks/calculate');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var basket;
    var experienceId;
    var experience;
    var useBaseCurrency;

    if (empty(flowOrder)) {
        return null;
    }

    basket = getBasket();
    basket.releaseInventory();

    experienceId = flowOrder.experience.key;
    experience = ExperienceHelper.getExperience(experienceId, null, null);
    useBaseCurrency = ExperienceHelper.useBaseCurrency(experience);

    Transaction.wrap(function () {
        var selections = flowOrder.selections || [];
        var paymentMethod = PaymentMgr.getPaymentMethod('FLOW_HOSTED_CHECKOUT');
        var orderPaymentInstrument;
        var flowBillingAddress = mapFlowDestinationToPaymentAddress(flowOrder.destination);
        var total;
        var currency;
        var amount;
        var i;

        clearBasket(basket);

        flowOrder.deliveries.forEach(function (delivery, index) {
            var shipment = createShipment(experienceId, basket, delivery, selections, !index);
            populateShipmentAddress(shipment, flowOrder.destination);
        });

        // Calls the flow.order.calculate hook
        hooksHelper('flow.order.calculate', 'calculate', basket, flowOrder, flowCalculate.calculate);

        amount = FlowHelper.getFlowPriceAmount(flowOrder.total, useBaseCurrency);
        currency = FlowHelper.getFlowPriceCurrency(flowOrder.total, useBaseCurrency);
        total = new Money(amount, currency);

        orderPaymentInstrument = basket.createPaymentInstrument(paymentMethod.ID, total);
        orderPaymentInstrument.paymentTransaction.setPaymentProcessor(paymentMethod.paymentProcessor);

        for (i = 0; i < flowOrder.payments.length; i++) {
            if (flowOrder.payments[0].address && flowOrder.payments[0].address.country) {
                flowBillingAddress = flowOrder.payments[0].address;
                break;
            }
        }

        populateBillingAddress(basket, flowBillingAddress, flowOrder.destination.contact.phone);
    });

    return basket;
}

module.exports = {
    assembleBasket: assembleBasket,
    getBasket: getBasket,
    clearBasket: clearBasket
};
