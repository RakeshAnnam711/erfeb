/* global empty:false */
'use strict';

/**
 * Calculates the included pricing of a allocation detail
 * @param {Object} detail - Allocation detail
 * @returns {Object} Included Pricing object
 */
function calculateIncludedPrices(detail) {
    var netPriceLocal = 0;
    var netPriceBase = 0;

    if (detail.included && detail.included.length) {
        detail.included.forEach(function (component) {
            if (component.discriminator && component.discriminator === 'allocation_detail_component') {
                netPriceLocal += component.total.amount;
                netPriceBase += component.total.base.amount;
            }
        });
    }

    return {
        netPriceLocal: netPriceLocal,
        netPriceBase: netPriceBase
    };
}

/**
 * A Flow Order Allocation
 * @param {string} data - Flow Order Allocation data
 * @constructor
 */
function OrderAllocationModel(data) {
    if (empty(data) || !data.id) {
        return null;
    }

    this.id = data.id;
    this.order = data.order;
    this.details = data.details || [];
    this.total = data.total;
}

OrderAllocationModel.prototype.getItemAllocation = function (productId) {
    var allocation = '';
    var detail;
    var i;

    if (productId) {
        for (i = 0; i < this.details.length; i++) {
            detail = this.details[i];
            if (detail.key === 'subtotal' && detail.number === productId) {
                allocation = JSON.stringify(detail, null, 1);
                break;
            }
        }
    }

    return allocation;
};

OrderAllocationModel.prototype.calculateFlowNetPrice = function (productId) {
    var netPrice = '';
    var includedPricing;
    var detail;
    var i;

    if (productId) {
        for (i = 0; i < this.details.length; i++) {
            detail = this.details[i];

            if (detail.key === 'subtotal' && detail.number === productId) {
                includedPricing = calculateIncludedPrices(detail);

                netPrice = JSON.stringify({
                    amount: includedPricing.netPriceLocal,
                    currency: detail.total.currency,
                    base: {
                        amount: includedPricing.netPriceBase,
                        currency: detail.total.base.currency
                    }
                }, null, 1);
                break;
            }
        }
    }

    return netPrice;
};

module.exports = OrderAllocationModel;
