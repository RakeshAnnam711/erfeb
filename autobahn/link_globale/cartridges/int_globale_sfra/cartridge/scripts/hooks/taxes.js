'use strict';

var base = module.superModule;
var originalCalculateTaxes = base.calculateTaxes;

var collections = require('*/cartridge/scripts/util/collections');
var globaleSession = require('*/cartridge/models/globale/session');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var logger = globaleHelpers.getLogger();
var TaxMgr = require('dw/order/TaxMgr');

/**
 * @typedef {Object} TaxField
 * @property {string} UUID - ID of the line item
 * @property {number|dw.value.Money} value - Eith erTax Code or Tax Amount that should be applied to the line item.
 * @property {boolean} [amount=false] - Boolean indicating whether value field contains Tax Amount (true) or Tax Rate (false).
 */

/**
 * @typedef {Object} Response
 * @property {Array<TaxField>} taxes - List of taxes to line items UUIDs to be applied to the order
 * @property {Object} custom - List of custom properties to be attached to the basket
 */

/**
 * Calculate sales taxes
 * @param {dw.order.Basket} basket - current basket
 * @returns {Response} - An object that contains calculated taxes and custom properties
 */
function calculateTaxes(basket) {
    if (!globaleSession.get('geOperatedCountry')) {
        return originalCalculateTaxes(basket);
    }

    var taxes = [];

    var shipments = basket.getShipments();
    collections.forEach(shipments, function (shipment) {
        var taxJurisdictionId = null;

        taxJurisdictionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geTaxJurisdictionId);

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

            logger.debug('1. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);

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
                logger.error('Line Item {0} has invalid Tax Class {1}', lineItem.lineItemText, lineItem.taxClassID);
                return;
            }

            // get the tax rate
            var taxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) !== null ? TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) : TaxMgr.getTaxRate(taxClassId, TaxMgr.defaultTaxJurisdictionID);

            // if tax rate is not defined, let's fall back to default tax class
            if (!taxRate && taxRate !== 0) {
                logger.error('Line Item {0} has invalid Tax Class - {1}. Tax Class definition does not exist in SFCC configuration', lineItem.lineItemText, taxClassId);
                taxRate = TaxMgr.getTaxRate(TaxMgr.defaultTaxClassID, TaxMgr.defaultTaxJurisdictionID);
            }

            // w/o a valid tax rate, we cannot calculate tax for the line item
            if (!taxRate && taxRate !== 0) {
                return;
            }

            // calculate the tax of the line item
            taxes.push({ uuid: lineItem.UUID, value: taxRate, amount: false });
            logger.debug('2. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);
        });
    });

    return { taxes: taxes, custom: {} };
}

module.exports = base;
module.exports.calculateTaxes = calculateTaxes;
