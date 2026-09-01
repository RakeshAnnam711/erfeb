/* global dw, empty, session */

'use strict';
/**
* Get any markup costs associated with real time rates
* that are configured on the shipping method in Business Manager
*
* @param {String} markupType Type of markup 'Amount' or 'Percentage'
* @param {number} markup amount to mark up
* @param {Money} updatedCost new cost with markup
*/

var getMarkupCost = function getMarkupCost(markupType, markup, shippingCost) {
    var Money = require('dw/value/Money');
    var updatedCost = shippingCost;

    if (!empty(markupType) && !empty(markup)) {
        if (markupType === 'Amount') {
            var amt = new Money(markup, session.currency.currencyCode);
            updatedCost = shippingCost.add(amt);
        } else if (markupType === 'Percent') {
            updatedCost = shippingCost.addPercent(markup);
        }
    }

    return updatedCost;
};

/**
* Calculate Shipping Costs Using Zenkraft Real-Time Rates instead
* of default SFCC rates
*
* @param {Object} basket Current basket for the session
* @param {Hashmap} shippingCostMap Hashmap of current rates in the user's session
*/
var calculateShippingCost = function calculateShippingCost(basket, shippingCostMap) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Money = require('dw/value/Money');
    var Site = require('dw/system/Site');
    var shipment;
    var shippingMethod;
    var shippingLineItems;

    // apply shipping cost, this needs to be done for all shipping methods to reset the shipping surcharges for each shipping method.
    ShippingMgr.applyShippingCost(basket);

    // re-apply shipping cost for shipping methods with Zenkraft rates
    shipment = basket.defaultShipment;
    shippingMethod = shipment.shippingMethod;
    shippingLineItems = shipment.shippingLineItems.iterator();

    // Match SFCC Shipping Method with Zenkraft ID in rates map, then use the rates in the map
    // in place of the SFCC rates in the basket
    if (shippingMethod != null && shippingCostMap[shippingMethod.custom.zenkraftID] != null && shippingCostMap[shippingMethod.custom.zenkraftID] !== 0) {
        while (shippingLineItems.hasNext()) {
            var shippingLineItem = shippingLineItems.next();
            var shippingCost = new Money(shippingCostMap[shippingMethod.custom.zenkraftID], Site.current.currencyCode);

            // add any markups
            var markupType = shippingMethod.custom.zenkraftRateMarkupType.value;
            var markup = shippingMethod.custom.zenkraftRateMarkup;

            shippingCost = this.getMarkupCost(markupType, markup, shippingCost);

            shippingLineItem.setPriceValue(shippingCost.value);
        }
    }
};

/**
* Set or Clear the saved shipping rates that are stored in a session variable
*
* @param {Object} rates Object of Shipping Methods and Rates. If empty, clear session variable
*/
var updateSessionShippingRates = function updateSessionRates(rates) {
    if (empty(rates)) {
        if (!empty(session.privacy.zenkraftCosts) && session.privacy.zenkraftCosts.length > 3) {
            session.privacy.zenkraftCosts = '';
        }
    } else {
        session.privacy.zenkraftCosts = rates;
    }

    return;
};

/* Exports of the module */
exports.calculateShippingCost = calculateShippingCost;
exports.updateSessionShippingRates = updateSessionShippingRates;
exports.getMarkupCost = getMarkupCost;
