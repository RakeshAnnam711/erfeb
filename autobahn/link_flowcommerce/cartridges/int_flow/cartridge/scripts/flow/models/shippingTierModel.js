'use strict';

/**
 * A Flow Shipping Tier
 * @param {string} data - Flow Shipping Tier data
 * @constructor
 */
function ShippingTierModel(data) {
    this.id = data.id;
    this.currency = data.currency;
    this.name = data.name;
}

module.exports = ShippingTierModel;
