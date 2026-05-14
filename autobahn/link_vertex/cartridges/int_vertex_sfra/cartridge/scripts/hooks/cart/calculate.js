/* eslint-disable */
'use strict';

/**
 * @module calculate.js
 *
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the new (smaller) CalculateCart.ds script file.  This allows OCAPI calls to reference
 * these tools via the OCAPI 'hook' mechanism
 *
 */
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var Vertex = require('*/cartridge/scripts/vertex');
var Helper = require('*/cartridge/scripts/helper/helper');

/**
 * @function calculateTax <p>
 *
 * Determines tax rates for all line items of the basket. Uses the shipping addresses
 * associated with the basket shipments to determine the appropriate tax jurisdiction.
 * Uses the tax class assigned to products and shipping methods to lookup tax rates. <p>
 *
 * Sets the tax-related fields of the line items. <p>
 *
 * Handles gift certificates, which aren't taxable. <p>
 *
 * Note that the function implements a fallback to the default tax jurisdiction
 * if no other jurisdiction matches the specified shipping location/shipping address.<p>
 *
 * Note that the function implements a fallback to the default tax class if a
 * product or a shipping method does explicitly define a tax class.
 *
 * @param {dw.order.Basket} basket The basket containing the elements for which taxes need to be calculated
 */
exports.calculateTax = function(basket) {
    try {
        if (!!basket.billingAddress){
            Vertex.CalculateTax('Quotation', basket);
        } else {
            Helper.prepareCart(basket);
        }
    } catch (e) {
        var whatiserror = e;
        Logger.getLogger('Vertex').error("Vertex error calculating tax: " + whatiserror.msg);
    }

    return new Status(Status.OK);
}
