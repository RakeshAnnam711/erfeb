'use strict';

/**
 * The model represented the order data hash
 */
function OrderDataHash() {
    const CacheMgr = require('dw/system/CacheMgr');
    const Site = require('dw/system/Site');

    const currentSiteID = Site.current.ID;

    this.ENCODED_PURCHASE_UNIT_STRING = currentSiteID + '_encoded_purchase_unit';
    this.orderDataHash = CacheMgr.getCache('orderDataHash');
    this.encodedPurchaseUnit = this.orderDataHash.get(this.ENCODED_PURCHASE_UNIT_STRING);
}

/**
 * Sets the encoded purchase unit to the OrderDataHash cache
 * @param {Object} purchaseUnit The order's purchase unit passed to PayPal order
 */
OrderDataHash.prototype.set = function(purchaseUnit) {
    const paypalUtils = require('*/cartridge/scripts/paypal/utils');
    const encodedPurchaseUnit = paypalUtils.encodeString(purchaseUnit);

    if (!this.encodedPurchaseUnit || encodedPurchaseUnit !== this.encodedPurchaseUnit) {
        this.orderDataHash.put(this.ENCODED_PURCHASE_UNIT_STRING, encodedPurchaseUnit);
        this.encodedPurchaseUnit = this.orderDataHash.get(this.ENCODED_PURCHASE_UNIT_STRING);
    }
};

/**
 * Returns the encoded purchase unit of PayPal's order
 * @returns {string} The encoded purchase unit
 */
OrderDataHash.prototype.get = function() {
    return this.orderDataHash.get(this.ENCODED_PURCHASE_UNIT_STRING);
};

/**
 * Clears the orderDataHash cache
 */
OrderDataHash.prototype.clear = function() {
    this.orderDataHash.invalidate(this.ENCODED_PURCHASE_UNIT_STRING);
    this.encodedPurchaseUnit = null;
};

module.exports = OrderDataHash;
