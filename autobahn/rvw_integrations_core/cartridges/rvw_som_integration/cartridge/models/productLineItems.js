'use strict';

var base = module.superModule;

var dwLogger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');

/**
 * @constructor
 * @classdesc This model extension includes additional custom attributes used on the Status Email
 * which are provided from SOM Status updates
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    base.call(this, productLineItems, view);

    var uuidMap = {};

    if (productLineItems && productLineItems.length > 0) {
        productLineItems.toArray().forEach(function(lineItem) {
            if (lineItem && lineItem.UUID) {
                uuidMap[lineItem.UUID] = lineItem;
            }
        });
    }

    if (this.items && this.items.length > 0) {
        this.items.forEach(function (item) {
            var lineItem = item && item.UUID && uuidMap[item.UUID];

            if (!empty(lineItem)) {
                try {
                    item.customQuantityCanceled = lineItem.custom.quantityCanceled;
                } catch (err) {
                    dwLogger.warn('LineItem custom quantity canceled attribute err: ' + err);
                }

                try {
                    item.customQuantityReturned = lineItem.custom.quantityReturned;
                } catch (err) {
                    dwLogger.warn('LineItem custom quantity returned attribute err: ' + err);
                }

                try {
                    item.customQuantityFullfilled = lineItem.custom.quantityFulfilled;
                } catch (err) {
                    dwLogger.warn('LineItem custom quantity fulfilled attribute err: ' + err);
                }

                try {
                    item.customQuantityOrdered = lineItem.custom.quantityOrdered;
                } catch (err) {
                    dwLogger.warn('LineItem custom quantity ordered attribute err: ' + err);
                }

                try {
                    item.customStatus = lineItem.custom.status;
                } catch (err) {
                    dwLogger.warn('LineItem custom status attribute err: ' + err);
                }

                try {
                    item.customTracking = lineItem.custom.trackingNumbersList;
                } catch (err) {
                    dwLogger.warn('LineItem custom tracking attribute err: ' + err);
                }

                try {
                    item.customExternalStatus = lineItem.externalLineItemStatus;

                    if (empty(item.customExternalStatus)) {
                        item.customExternalStatus = 'externalLineItemStatus' in lineItem.custom ? lineItem.custom.externalLineItemStatus : null;
                    }
                } catch (err) {
                    dwLogger.warn('LineItem custom externalLineItemStatus attribute err: ' + err);
                }
            }
        });
    }
};

ProductLineItems.prototype = Object.create(base.prototype);

module.exports = ProductLineItems;

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
