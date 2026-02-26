'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ShippingLocation = require('dw/order/ShippingLocation');
var TaxMgr = require('dw/order/TaxMgr');
var Logger = require('dw/system/Logger');

/**
 * @typedef {Object} Response
 * @property {[TaxField]} taxes - List of taxes to line items UUIDs to be applied to the order
 * @property {Object} custom - List of custom properties to be attached to the basket
 */

/**
 * @typedef {Object} TaxField
 * @property {string} UUID - ID of the line item
 * @property {number|dw.value.Money} value - Either Tax Code or Tax Amount that should be applied to the line item.
 * @property {boolean="false"} amount - Boolean indicating whether value field contains Tax Amount (true) or Tax Rate (false).
 */

/**
 * Calculate sales taxes
 * @param {dw.order.Basket} basket - current basket
 * @returns {Response} - An object that contains calculated taxes and custom properties
 */
function calculateTaxes(basket) {
    var taxes = [];
    var extraTaxCodeMap = JSON.parse(dw.system.Site.current.getCustomPreferenceValue('extraShippingTaxCodeJSON'));

    var allExtraTaxCodes = new Set();
    for (var country in Object.keys(extraTaxCodeMap)) {
        var country = Object.keys(extraTaxCodeMap)[country];
        for (var region in Object.keys(extraTaxCodeMap[country])) {
            var region = Object.keys(extraTaxCodeMap[country])[region];
            for (var taxCode of extraTaxCodeMap[country][region].codes) {
                allExtraTaxCodes.add(taxCode.ID);
            }
        }
    }

    var shipments = basket.getShipments();
    collections.forEach(shipments, function (shipment) {
        var taxJurisdictionId = null;

        if (shipment.shippingAddress) {
            var location = new ShippingLocation(shipment.shippingAddress);
            taxJurisdictionId = TaxMgr.getTaxJurisdictionID(location);
        }

        if (!taxJurisdictionId) {
            taxJurisdictionId = TaxMgr.defaultTaxJurisdictionID;
        }

        // if we have no tax jurisdiction, we cannot calculate tax
        if (!taxJurisdictionId) {
            return;
        }

        var lineItems = shipment.getAllLineItems();

        collections.forEach(lineItems, function (lineItem) {
            var taxClassId = lineItem.taxClassID;
            // RVW AB If the shipping line item is a special shipping tax code, remove it, we'll re-add it below
            if ('ID' in lineItem && allExtraTaxCodes.has(lineItem.ID)) {
                shipment.removeShippingLineItem(lineItem);
                return;
            }

            Logger.debug('1. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);

            // do not touch line items with fix tax rate
            if (taxClassId === TaxMgr.customRateTaxClassID) {
                return;
            }

            // line item does not define a valid tax class; let's fall back to default tax class
            if (!taxClassId) {
                taxClassId = TaxMgr.defaultTaxClassID;
            }

            // if we have no tax class, we cannot calculate tax
            if (!taxClassId) {
                Logger.error('Line Item {0} has invalid Tax Class {1}', lineItem.lineItemText, lineItem.taxClassID);
                return;
            }

            // get the tax rate
            var taxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
            // w/o a valid tax rate, we cannot calculate tax for the line item
            if (empty(taxRate)) {
                return;
            }

            // calculate the tax of the line item
            taxes.push({ uuid: lineItem.UUID, value: taxRate, amount: false });
            Logger.debug('2. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);
        });
    });

    shipments = basket.getShipments();
    collections.forEach(shipments, function (shipment) {
        if (!empty(shipment.shippingAddress)) {
            if (empty(shipment.custom.fromStoreId) && shipment.productLineItems && shipment.productLineItems.length > 0 && !empty(extraTaxCodeMap[shipment.shippingAddress.countryCode.value]) && !empty(extraTaxCodeMap[shipment.shippingAddress.countryCode.value][shipment.shippingAddress.stateCode])) {
                for (var taxCode of extraTaxCodeMap[shipment.shippingAddress.countryCode.value][shipment.shippingAddress.stateCode].codes) {
                    if (!taxCode.included) {
                        taxCode.included = true;
                        // item is for new special shipping line item tax
                        var newItem = shipment.createShippingLineItem(taxCode.ID);
                        newItem.setLineItemText(taxCode.description[request.locale] || taxCode.description['default'] || 'surcharge');
                        newItem.setPriceValue(taxCode.amountInCents / 100);
                        newItem.updateTax(0);
                        taxes.push({ uuid: newItem.UUID, value: 0, amount: false});
                    }
                }
            }
        }
    });

    return { taxes: taxes, custom: {} };
}

module.exports = {
    calculateTaxes: calculateTaxes
};
